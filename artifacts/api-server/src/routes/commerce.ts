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
