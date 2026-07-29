import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { db, usersTable, walletTransactionsTable } from "@workspace/db";
import BraleService from "../services/brale-service";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { authenticatedUserId } from "../middleware/identity";

const router = Router();
router.use("/wallet", requireAuth, requireRole("Fan"));
const parseUserId = (value: unknown) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

router.get("/wallet/users", async (req: AuthenticatedRequest, res) => {
  const userId = authenticatedUserId(req)!;
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (!userId) { res.status(401).json({ error: "User identity is required" }); return; }
  if (query.length < 2) { res.json({ users: [] }); return; }
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const users = await db.select({
    id: usersTable.id,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    email: usersTable.email,
    phoneNumber: usersTable.phoneNumber,
    primaryClubId: usersTable.primaryClubId,
  }).from(usersTable).where(and(
    sql`${usersTable.id} <> ${userId}`,
    or(
      ilike(usersTable.firstName, pattern), ilike(usersTable.lastName, pattern),
      ilike(usersTable.email, pattern), ilike(usersTable.phoneNumber, pattern),
      ilike(sql`concat_ws(' ', ${usersTable.firstName}, ${usersTable.lastName})`, pattern),
    ),
  )).limit(20);
  res.json({ users: users.map((user) => ({ ...user, name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0] })) });
});

router.get("/wallet/receive", async (req: AuthenticatedRequest, res) => {
  const userId = authenticatedUserId(req)!;
  if (!userId) { res.status(401).json({ error: "User identity is required" }); return; }
  const [user] = await db.select({ id: usersTable.id, email: usersTable.email, braleAddressId: usersTable.braleAddressId })
    .from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ email: user.email, walletIdentifier: user.braleAddressId ?? user.email, qrValue: `rewlo://receive/${encodeURIComponent(user.email)}` });
});

router.post("/wallet/send", async (req: AuthenticatedRequest, res) => {
  const senderId = authenticatedUserId(req)!;
  const recipientId = parseUserId(req.body?.recipientId);
  const amount = typeof req.body?.amount === "string" ? req.body.amount : String(req.body?.amount ?? "");
  if (!senderId) { res.status(401).json({ error: "User identity is required" }); return; }
  if (!recipientId || recipientId === senderId) { res.status(400).json({ error: "Select a valid recipient" }); return; }
  if (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) <= 0) { res.status(400).json({ error: "Enter a valid positive amount" }); return; }
  const amountCents = Math.round(Number(amount) * 100);
  const reference = randomUUID();

  try {
    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(sql`
        SELECT id, email, first_name, last_name, rewlo_cash_balance, brale_address_id
        FROM users WHERE id IN (${senderId}, ${recipientId}) ORDER BY id FOR UPDATE
      `);
      const rows = locked.rows as Array<{ id: number; email: string; first_name: string | null; last_name: string | null; rewlo_cash_balance: number; brale_address_id: string | null }>;
      const sender = rows.find((row) => row.id === senderId);
      const recipient = rows.find((row) => row.id === recipientId);
      if (!sender || !recipient) throw new Error("USER_NOT_FOUND");
      if (sender.rewlo_cash_balance < amountCents) throw new Error("INSUFFICIENT_BALANCE");
      if (!sender.brale_address_id || !recipient.brale_address_id) throw new Error("WALLET_NOT_CONFIGURED");

      const braleResponse = await new BraleService().transferStablecoin({
        userId: senderId, sourceAddressId: sender.brale_address_id,
        destinationAddressId: recipient.brale_address_id, amount: { value: amount, currency: "USD" },
        idempotencyKey: reference,
      });
      const externalId = typeof braleResponse === "object" && braleResponse && "id" in braleResponse ? String(braleResponse.id) : null;
      await tx.update(usersTable).set({ rewloCashBalance: sql`${usersTable.rewloCashBalance} - ${amountCents}` }).where(eq(usersTable.id, senderId));
      await tx.update(usersTable).set({ rewloCashBalance: sql`${usersTable.rewloCashBalance} + ${amountCents}` }).where(eq(usersTable.id, recipientId));
      const recipientName = [recipient.first_name, recipient.last_name].filter(Boolean).join(" ") || recipient.email;
      const senderName = [sender.first_name, sender.last_name].filter(Boolean).join(" ") || sender.email;
      await tx.insert(walletTransactionsTable).values([
        { userId: senderId, relatedUserId: recipientId, type: "send", status: "completed", amountCents: -amountCents, reference: `${reference}:send`, externalTransactionId: externalId, description: `Sent to ${recipientName}`, metadata: { provider: "brale", braleResponse } },
        { userId: recipientId, relatedUserId: senderId, type: "receive", status: "completed", amountCents, reference: `${reference}:receive`, externalTransactionId: externalId, description: `Received from ${senderName}`, metadata: { provider: "brale", braleResponse } },
      ]);
      return { reference, externalTransactionId: externalId, amount, recipient: recipientName, balanceCents: sender.rewlo_cash_balance - amountCents };
    });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "TRANSFER_FAILED";
    const known: Record<string, [number, string]> = {
      USER_NOT_FOUND: [404, "User not found"], INSUFFICIENT_BALANCE: [409, "Insufficient wallet balance"],
      WALLET_NOT_CONFIGURED: [409, "Sender or recipient Brale wallet is not configured"],
    };
    const [status, detail] = known[message] ?? [502, "Transfer could not be completed"];
    req.log.error({ error }, "Wallet transfer failed");
    res.status(status).json({ error: detail });
  }
});

export default router;
