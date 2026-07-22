import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import {
  db,
  merchantsTable,
  offerCategoriesTable,
  offerRedemptionsTable,
  offersTable,
  rewardTransactionsTable,
  userCardsTable,
  usersTable,
  walletTransactionsTable,
} from "@workspace/db";
import BraleService from "../services/brale-service";

const router = Router();
const actor = (value: string | undefined) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const money = (value: unknown) => {
  const text = typeof value === "string" ? value : String(value ?? "");
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) > 0
    ? { text, cents: Math.round(Number(text) * 100) }
    : null;
};
const externalId = (value: unknown) =>
  typeof value === "object" && value !== null && "id" in value
    ? String(value.id)
    : null;

router.get("/wallet/summary", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  const [u] = await db
    .select({
      balanceCents: usersTable.rewloCashBalance,
      rewardPoints: usersTable.rewloRewardPoints,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!u) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(u);
});

router.get("/wallet/transactions", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(50, Math.max(5, Number.parseInt(String(req.query.pageSize ?? "20"), 10) || 20));
  const filter = String(req.query.type ?? "all").toLowerCase();
  const status = String(req.query.status ?? "all").toLowerCase();
  const search = String(req.query.search ?? "").trim();
  const allowedTypes = new Set(["all", "send", "receive", "top_up", "reward_earned", "reward_redeemed", "merchant_payment", "mint", "burn"]);
  const allowedStatuses = new Set(["all", "pending", "completed", "failed", "reversed"]);
  if (!allowedTypes.has(filter) || !allowedStatuses.has(status)) { res.status(400).json({ error: "Invalid transaction filter" }); return; }
  const rows = await db.execute(sql`
    WITH unified AS (
      SELECT 'wallet-' || wt.id AS id,
        CASE WHEN wt.type='redeem' THEN 'burn' WHEN wt.type='reward' THEN 'reward_earned' ELSE wt.type::text END AS type,
        wt.status::text AS status,
        wt.amount_cents AS amount_cents, wt.reward_points_delta AS points_delta,
        wt.description, wt.reference, wt.external_transaction_id, wt.created_at,
        m.merchant_name AS merchant
      FROM wallet_transactions wt LEFT JOIN merchants m ON m.id=wt.merchant_id
      WHERE wt.user_id=${id}
        AND wt.type IN ('send','receive','top_up','reward','redeem','merchant_payment','mint','burn')
        AND NOT (wt.type='redeem' AND EXISTS (SELECT 1 FROM offer_redemptions r WHERE r.user_id=wt.user_id AND r.reference=wt.reference))
      UNION ALL
      SELECT 'reward-' || rt.id, CASE WHEN rt.points_delta >= 0 THEN 'reward_earned' ELSE 'reward_redeemed' END,
        'completed', 0, rt.points_delta, rt.reason, rt.reference, NULL, rt.created_at, NULL
      FROM reward_transactions rt WHERE rt.user_id=${id}
    ), filtered AS (
      SELECT *, count(*) OVER() AS total_count FROM unified
      WHERE (${filter}='all' OR type=${filter})
        AND (${status}='all' OR status=${status})
        AND (${search}='' OR description ILIKE ${`%${search}%`} OR reference ILIKE ${`%${search}%`} OR COALESCE(merchant,'') ILIKE ${`%${search}%`})
    ) SELECT * FROM filtered ORDER BY created_at DESC, id DESC LIMIT ${pageSize} OFFSET ${(page-1)*pageSize}
  `);
  const items = rows.rows.map((row) => ({
    id: String(row.id), type: String(row.type), status: String(row.status),
    amountCents: Number(row.amount_cents), pointsDelta: Number(row.points_delta),
    description: String(row.description ?? "Transaction"), reference: String(row.reference),
    externalTransactionId: row.external_transaction_id ? String(row.external_transaction_id) : null,
    merchant: row.merchant ? String(row.merchant) : null, createdAt: new Date(String(row.created_at)).toISOString(),
  }));
  const total = rows.rows[0] ? Number(rows.rows[0].total_count) : 0;
  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total/pageSize), hasMore: page*pageSize<total } });
});
router.get("/wallet/cards", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  res.json({
    cards: await db
      .select()
      .from(userCardsTable)
      .where(eq(userCardsTable.userId, id)),
  });
});
router.post("/wallet/top-up", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  const cardId = Number(req.body?.cardId);
  const amount = money(req.body?.amount);
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  if (!amount) {
    res.status(400).json({ error: "Enter a valid amount" });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id, brale_address_id, rewlo_cash_balance FROM users WHERE id=${id} FOR UPDATE`,
      );
      const user = locked.rows[0] as
        | { brale_address_id: string | null; rewlo_cash_balance: number }
        | undefined;
      if (!user) throw new Error("USER_NOT_FOUND");
      const [card] = await tx
        .select()
        .from(userCardsTable)
        .where(
          and(eq(userCardsTable.id, cardId), eq(userCardsTable.userId, id)),
        );
      if (!card) throw new Error("CARD_NOT_FOUND");
      if (!user.brale_address_id) throw new Error("WALLET_NOT_CONFIGURED");
      const reference = randomUUID();
      const brale = await new BraleService().mintStablecoin({
        userId: id,
        destinationAddressId: user.brale_address_id,
        amount: { value: amount.text, currency: "USD" },
        idempotencyKey: reference,
      });
      await tx
        .update(usersTable)
        .set({
          rewloCashBalance: sql`${usersTable.rewloCashBalance}+${amount.cents}`,
        })
        .where(eq(usersTable.id, id));
      await tx
        .insert(walletTransactionsTable)
        .values({
          userId: id,
          type: "top_up",
          status: "completed",
          amountCents: amount.cents,
          reference: `${reference}:topup`,
          externalTransactionId: externalId(brale),
          description: `Top up · ${card.provider} •••• ${card.last4Digits}`,
          metadata: { provider: "brale", demoCard: true, braleResponse: brale },
        });
      return {
        reference,
        balanceCents: user.rewlo_cash_balance + amount.cents,
      };
    });
    res.status(201).json(result);
  } catch (e) {
    req.log.error({ e }, "Top up failed");
    const m = e instanceof Error ? e.message : "";
    res
      .status(
        m === "CARD_NOT_FOUND"
          ? 404
          : m === "WALLET_NOT_CONFIGURED"
            ? 409
            : 502,
      )
      .json({
        error:
          m === "CARD_NOT_FOUND"
            ? "Card not found"
            : m === "WALLET_NOT_CONFIGURED"
              ? "Brale wallet is not configured"
              : "Top up failed",
      });
  }
});

router.get("/rewards", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  const [user] = await db
    .select({ points: usersTable.rewloRewardPoints })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const rows = await db
    .select({
      id: offersTable.id,
      merchant: offersTable.merchant,
      title: offersTable.title,
      description: offersTable.description,
      discount: offersTable.discountLabel,
      pointsCost: offersTable.pointsRequired,
      expiresAt: offersTable.expiresAt,
      category: offerCategoriesTable.name,
      redemptionId: offerRedemptionsTable.id,
    })
    .from(offersTable)
    .innerJoin(
      offerCategoriesTable,
      eq(offersTable.categoryId, offerCategoriesTable.id),
    )
    .leftJoin(
      offerRedemptionsTable,
      and(
        eq(offerRedemptionsTable.offerId, offersTable.id),
        eq(offerRedemptionsTable.userId, id),
      ),
    )
    .where(
      and(
        eq(offersTable.available, true),
        gt(offersTable.expiresAt, new Date()),
      ),
    );
  const history = await db
    .select()
    .from(offerRedemptionsTable)
    .where(eq(offerRedemptionsTable.userId, id))
    .orderBy(desc(offerRedemptionsTable.createdAt));
  res.json({
    points: user.points,
    offers: rows.map((o) => ({
      ...o,
      expiresAt: o.expiresAt.toISOString().slice(0, 10),
      redeemed: o.redemptionId !== null,
    })),
    history,
  });
});
router.post("/rewards/:offerId/redeem", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  const offerId = Number(req.params.offerId);
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id, rewlo_reward_points, brale_address_id FROM users WHERE id=${id} FOR UPDATE`,
      );
      const user = locked.rows[0] as
        | { rewlo_reward_points: number; brale_address_id: string | null }
        | undefined;
      const [offer] = await tx
        .select()
        .from(offersTable)
        .where(
          and(
            eq(offersTable.id, offerId),
            eq(offersTable.available, true),
            gt(offersTable.expiresAt, new Date()),
          ),
        );
      if (!user || !offer) throw new Error("NOT_FOUND");
      if (user.rewlo_reward_points < offer.pointsRequired)
        throw new Error("INSUFFICIENT_POINTS");
      if (!user.brale_address_id) throw new Error("WALLET_NOT_CONFIGURED");
      const reference = randomUUID();
      const value = (offer.redemptionValueCents / 100).toFixed(2);
      const brale = await new BraleService().redeemStablecoin({
        userId: id,
        sourceAddressId: user.brale_address_id,
        amount: { value, currency: "USD" },
        idempotencyKey: reference,
      });
      await tx
        .update(usersTable)
        .set({
          rewloRewardPoints: sql`${usersTable.rewloRewardPoints}-${offer.pointsRequired}`,
        })
        .where(eq(usersTable.id, id));
      await tx
        .insert(offerRedemptionsTable)
        .values({
          userId: id,
          offerId,
          pointsSpent: offer.pointsRequired,
          reference,
          braleTransactionId: externalId(brale),
        });
      await tx
        .insert(rewardTransactionsTable)
        .values({
          userId: id,
          pointsDelta: -offer.pointsRequired,
          reason: `Redeemed: ${offer.title}`,
          reference: `${reference}:points`,
        });
      return {
        reference,
        points: user.rewlo_reward_points - offer.pointsRequired,
        braleTransactionId: externalId(brale),
      };
    });
    res.status(201).json(result);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    res
      .status(m === "INSUFFICIENT_POINTS" ? 409 : m === "NOT_FOUND" ? 404 : 502)
      .json({
        error:
          m === "INSUFFICIENT_POINTS"
            ? "Not enough points"
            : m === "NOT_FOUND"
              ? "Offer unavailable"
              : "Redemption failed",
      });
  }
});

router.get("/merchants/:code", async (req, res) => {
  const [merchant] = await db
    .select({
      id: merchantsTable.id,
      code: merchantsTable.merchantCode,
      name: merchantsTable.merchantName,
      description: merchantsTable.description,
    })
    .from(merchantsTable)
    .where(
      eq(merchantsTable.merchantCode, String(req.params.code).toUpperCase()),
    );
  if (!merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }
  res.json(merchant);
});
router.post("/wallet/merchant-pay", async (req, res) => {
  const id = actor(req.header("x-rewlo-user-id"));
  const amount = money(req.body?.amount);
  const code = String(req.body?.merchantCode ?? "").toUpperCase();
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  if (!amount) {
    res.status(400).json({ error: "Enter a valid amount" });
    return;
  }
  try {
    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id, rewlo_cash_balance, brale_address_id FROM users WHERE id=${id} FOR UPDATE`,
      );
      const user = locked.rows[0] as
        | { rewlo_cash_balance: number; brale_address_id: string | null }
        | undefined;
      const [merchant] = await tx
        .select()
        .from(merchantsTable)
        .where(eq(merchantsTable.merchantCode, code));
      if (!user || !merchant) throw new Error("NOT_FOUND");
      if (user.rewlo_cash_balance < amount.cents)
        throw new Error("INSUFFICIENT_BALANCE");
      if (!user.brale_address_id || !merchant.braleAddressId)
        throw new Error("WALLET_NOT_CONFIGURED");
      const reference = randomUUID();
      const brale = await new BraleService().transferStablecoin({
        userId: id,
        sourceAddressId: user.brale_address_id,
        destinationAddressId: merchant.braleAddressId,
        amount: { value: amount.text, currency: "USD" },
        idempotencyKey: reference,
      });
      await tx
        .update(usersTable)
        .set({
          rewloCashBalance: sql`${usersTable.rewloCashBalance}-${amount.cents}`,
        })
        .where(eq(usersTable.id, id));
      await tx
        .update(merchantsTable)
        .set({
          rewloCashBalance: sql`${merchantsTable.rewloCashBalance}+${amount.cents}`,
        })
        .where(eq(merchantsTable.id, merchant.id));
      await tx
        .insert(walletTransactionsTable)
        .values({
          userId: id,
          merchantId: merchant.id,
          type: "merchant_payment",
          status: "completed",
          amountCents: -amount.cents,
          reference: `${reference}:payment`,
          externalTransactionId: externalId(brale),
          description: `Payment to ${merchant.merchantName}`,
          metadata: { provider: "brale", braleResponse: brale },
        });
      return {
        reference,
        merchant: merchant.merchantName,
        amount: amount.text,
        balanceCents: user.rewlo_cash_balance - amount.cents,
        externalTransactionId: externalId(brale),
      };
    });
    res.status(201).json(result);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    res
      .status(
        m === "INSUFFICIENT_BALANCE" ? 409 : m === "NOT_FOUND" ? 404 : 502,
      )
      .json({
        error:
          m === "INSUFFICIENT_BALANCE"
            ? "Insufficient balance"
            : m === "NOT_FOUND"
              ? "Merchant not found"
              : "Payment failed",
      });
  }
});
export default router;
