import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, desc, eq, gt, isNotNull, sql } from "drizzle-orm";
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
import BraleService, { BraleApiError } from "../services/brale-service";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { authenticatedUserId } from "../middleware/identity";

const router = Router();
router.use(requireAuth, requireRole("Fan"));
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

function providerStatus(value: unknown): "pending" | "completed" | "failed" | "reversed" {
  const status = value && typeof value === "object" && "status" in value
    ? (value as { status?: unknown }).status
    : undefined;
  if (status === "completed" || status === "complete" || status === "succeeded") return "completed";
  if (status === "failed" || status === "rejected" || status === "canceled" || status === "cancelled") return "failed";
  if (status === "reversed") return "reversed";
  return "pending";
}

router.get("/wallet/summary", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  const [u] = await db
    .select({
      balanceCents: usersTable.rewloCashBalance,
      rewardPoints: usersTable.rewloPoints,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!u) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const spend = await db.execute(sql`
    SELECT COALESCE(SUM(-amount_cents), 0) AS total_spend_cents
    FROM wallet_transactions
    WHERE user_id=${id}
      AND type IN ('send', 'merchant_payment')
      AND status='completed'
  `);
  res.json({ ...u, totalSpendCents: Number(spend.rows[0]?.total_spend_cents ?? 0) });
});

router.get("/wallet/transactions", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
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
    ) SELECT * FROM filtered ORDER BY created_at DESC, id DESC LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `);
  const items = rows.rows.map((row) => ({
    id: String(row.id), type: String(row.type), status: String(row.status),
    amountCents: Number(row.amount_cents), pointsDelta: Number(row.points_delta),
    description: String(row.description ?? "Transaction"), reference: String(row.reference),
    externalTransactionId: row.external_transaction_id ? String(row.external_transaction_id) : null,
    merchant: row.merchant ? String(row.merchant) : null, createdAt: new Date(String(row.created_at)).toISOString(),
  }));
  const total = rows.rows[0] ? Number(rows.rows[0].total_count) : 0;
  res.json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize), hasMore: page * pageSize < total } });
});

// Brale transfers settle asynchronously. Activity explicitly invokes this
// endpoint, so normal ledger reads never wait for a provider status check.
router.post("/wallet/transactions/refresh-pending", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }

  const pendingMints = await db
    .select({ id: walletTransactionsTable.id, externalTransactionId: walletTransactionsTable.externalTransactionId })
    .from(walletTransactionsTable)
    .where(and(
      eq(walletTransactionsTable.userId, id),
      eq(walletTransactionsTable.type, "mint"),
      eq(walletTransactionsTable.status, "pending"),
      isNotNull(walletTransactionsTable.externalTransactionId),
    ))
    .limit(10);

  const brale = new BraleService();
  let updated = 0;
  let unavailable = 0;
  for (const mint of pendingMints) {
    const transactionId = mint.externalTransactionId;
    if (!transactionId) continue;
    try {
      const providerResponse = await brale.getTransactionStatus({ userId: id, transactionId });
      const status = providerStatus(providerResponse);
      if (status !== "pending") {
        await db.update(walletTransactionsTable).set({ status }).where(eq(walletTransactionsTable.id, mint.id));
        updated += 1;
      }
    } catch (error) {
      unavailable += 1;
      req.log.warn({ error, transactionId }, "Could not refresh Brale mint status");
    }
  }
  res.json({ checked: pendingMints.length, updated, unavailable });
});
router.get("/wallet/cards", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
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

// Every wallet receives a branded Rewlo Premium card record. This is a product
// card, not a payment-card substitute: no PAN, CVV, or external card data is
// created or stored here.
router.post("/wallet/cards/provision", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) { res.status(401).json({ error: "User identity is required" }); return; }

  const [existing] = await db.select().from(userCardsTable)
    .where(eq(userCardsTable.userId, id)).limit(1);
  if (existing) { res.json({ card: existing }); return; }

  const [user] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [card] = await db.insert(userCardsTable).values({
    userId: id,
    cardHolder: [user.firstName, user.lastName].filter(Boolean).join(" ").toUpperCase() || "REWLO MEMBER",
    last4Digits: "XXXX",
    expiry: "11/27",
    cardType: "REWLO PREMIUM",
    provider: "Mastercard",
    isDefault: true,
  }).returning();
  res.status(201).json({ card });
});

router.post("/wallet/top-up", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
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
    // Reuse the access token while resolving a legacy platform address and
    // submitting the mint; otherwise a slow auth request is needlessly made
    // twice for a single top-up.
    const braleService = new BraleService();
    // Users created before platform custody was introduced have no address.
    // Resolve the approved business account once and backfill them below.
    const [walletUser] = await db.select({ braleAddressId: usersTable.braleAddressId })
      .from(usersTable).where(eq(usersTable.id, id)).limit(1);
    const platformWallet = walletUser?.braleAddressId
      ? null
      : await braleService.getPlatformCustodialAddress();
    if (platformWallet) {
      // Persist platform custody before the mint. A provider-side mint error
      // must not leave an otherwise valid fan marked as provisioning failed.
      await db.update(usersTable).set({
        ...platformWallet,
        braleWalletId: platformWallet.braleAddressId,
        walletProvisioningStatus: "completed",
        walletProvisioningError: null,
        walletProvisionedAt: new Date(),
      }).where(eq(usersTable.id, id));
    }

    const [card] = await db.select().from(userCardsTable)
      .where(and(eq(userCardsTable.id, cardId), eq(userCardsTable.userId, id)));
    if (!card) throw new Error("CARD_NOT_FOUND");

    const [fundingUser] = await db.select({ braleAddressId: usersTable.braleAddressId })
      .from(usersTable).where(eq(usersTable.id, id)).limit(1);
    const destinationAddressId = fundingUser?.braleAddressId ?? platformWallet?.braleAddressId;
    if (!destinationAddressId) throw new Error("WALLET_NOT_CONFIGURED");

    // Do not hold a database lock while calling Brale. BraleService persists
    // its provider audit record through a separate connection; doing that
    // inside the transaction below causes both operations to wait on each
    // other indefinitely.
    const reference = randomUUID();
    const brale = await braleService.mintStablecoin({
      userId: id,
      destinationAddressId,
      amount: { value: amount.text, currency: "USD" },
      idempotencyKey: reference,
    });

    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id, brale_address_id, rewlo_cash_balance FROM users WHERE id=${id} FOR UPDATE`,
      );
      const user = locked.rows[0] as
        | { brale_address_id: string | null; rewlo_cash_balance: number }
        | undefined;
      if (!user) throw new Error("USER_NOT_FOUND");
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
          metadata: { provider: "brale", braleResponse: brale },
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
    const providerError = e instanceof BraleApiError ? e : null;
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
              : providerError?.message ?? "Top up failed",
        providerCode: providerError?.code,
        providerRequestId: providerError?.requestId,
      });
  }
});

router.get("/rewards", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  const [user] = await db
    .select({ points: usersTable.rewloPoints })
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
  const pointTotals = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN points_delta > 0 THEN points_delta ELSE 0 END), 0) AS points_earned,
      COALESCE(SUM(CASE WHEN points_delta < 0 THEN -points_delta ELSE 0 END), 0) AS points_spent
    FROM reward_transactions
    WHERE user_id=${id}
  `);
  const totals = pointTotals.rows[0] ?? {};
  res.json({
    points: user.points,
    stats: {
      pointsEarned: Number(totals.points_earned ?? 0),
      pointsSpent: Number(totals.points_spent ?? 0),
      offersUsed: history.length,
    },
    offers: rows.map((o) => ({
      ...o,
      expiresAt: o.expiresAt.toISOString().slice(0, 10),
      redeemed: o.redemptionId !== null,
    })),
    history,
  });
});
router.post("/rewards/:offerId/redeem", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const offerId = Number(req.params.offerId);
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  if (!Number.isSafeInteger(offerId) || offerId <= 0) {
    res.status(400).json({ error: "Offer unavailable" });
    return;
  }
  try {
    // The Brale client stores an audit row through its own connection. Calling
    // it while this transaction holds a user lock creates a lock wait that can
    // outlive the browser request. Validate first, then call Brale without a
    // database lock; the transaction below validates again before committing.
    const [preflightUser] = await db
      .select({ points: usersTable.rewloPoints, braleAddressId: usersTable.braleAddressId })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    const [preflightOffer] = await db
      .select()
      .from(offersTable)
      .where(and(eq(offersTable.id, offerId), eq(offersTable.available, true), gt(offersTable.expiresAt, new Date())));
    if (!preflightUser || !preflightOffer) throw new Error("NOT_FOUND");
    if (preflightUser.points < preflightOffer.pointsRequired) throw new Error("INSUFFICIENT_POINTS");
    if (!preflightUser.braleAddressId) throw new Error("WALLET_NOT_CONFIGURED");

    // The stable key makes a retry safe if the provider accepted the redemption
    // but the local database operation failed before its response was sent.
    const reference = `REDEEM-${id}-${offerId}`;
    const brale = await new BraleService().redeemStablecoin({
      userId: id,
      sourceAddressId: preflightUser.braleAddressId,
      amount: { value: (preflightOffer.redemptionValueCents / 100).toFixed(2), currency: "USD" },
      idempotencyKey: reference,
    });

    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id, rewlo_points, brale_address_id FROM users WHERE id=${id} FOR UPDATE`,
      );
      const user = locked.rows[0] as
        | { rewlo_points: number; brale_address_id: string | null }
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
      if (user.rewlo_points < offer.pointsRequired)
        throw new Error("INSUFFICIENT_POINTS");
      if (!user.brale_address_id) throw new Error("WALLET_NOT_CONFIGURED");
      const [existingRedemption] = await tx
        .select({ id: offerRedemptionsTable.id })
        .from(offerRedemptionsTable)
        .where(and(eq(offerRedemptionsTable.userId, id), eq(offerRedemptionsTable.offerId, offerId)))
        .limit(1);
      if (existingRedemption) throw new Error("ALREADY_REDEEMED");
      await tx
        .update(usersTable)
        .set({
          rewloPoints: sql`${usersTable.rewloPoints}-${offer.pointsRequired}`,
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
        points: user.rewlo_points - offer.pointsRequired,
        braleTransactionId: externalId(brale),
      };
    });
    res.status(201).json(result);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const providerError = e instanceof BraleApiError ? e : null;
    res
      .status(m === "INSUFFICIENT_POINTS" || m === "ALREADY_REDEEMED" ? 409 : m === "NOT_FOUND" ? 404 : m === "WALLET_NOT_CONFIGURED" ? 409 : 502)
      .json({
        error:
          m === "INSUFFICIENT_POINTS"
            ? "Not enough points"
            : m === "ALREADY_REDEEMED"
              ? "This offer has already been redeemed"
            : m === "NOT_FOUND"
              ? "Offer unavailable"
              : m === "WALLET_NOT_CONFIGURED"
                ? "Brale wallet is not configured"
                : providerError?.message ?? "Redemption failed",
        providerCode: providerError?.code,
        providerRequestId: providerError?.requestId,
      });
  }
});

router.get("/merchants/:code", async (req: AuthenticatedRequest, res) => {
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
router.post("/wallet/merchant-pay", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
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
    // BraleService records its provider audit entry through a separate DB
    // connection. Resolve the transfer outside a transaction so that audit
    // write cannot wait on this user's row lock.
    const [preflightUser] = await db
      .select({ balanceCents: usersTable.rewloCashBalance, braleAddressId: usersTable.braleAddressId })
      .from(usersTable)
      .where(eq(usersTable.id, id));
    const [preflightMerchant] = await db
      .select()
      .from(merchantsTable)
      .where(eq(merchantsTable.merchantCode, code));
    if (!preflightUser || !preflightMerchant) throw new Error("NOT_FOUND");
    if (preflightUser.balanceCents < amount.cents) throw new Error("INSUFFICIENT_BALANCE");
    if (!preflightUser.braleAddressId || !preflightMerchant.braleAddressId) throw new Error("WALLET_NOT_CONFIGURED");

    const reference = randomUUID();
    const brale = await new BraleService().transferStablecoin({
      userId: id,
      sourceAddressId: preflightUser.braleAddressId,
      destinationAddressId: preflightMerchant.braleAddressId,
      amount: { value: amount.text, currency: "USD" },
      idempotencyKey: reference,
    });

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
    const providerError = e instanceof BraleApiError ? e : null;
    res
      .status(
        m === "INSUFFICIENT_BALANCE" || m === "WALLET_NOT_CONFIGURED" ? 409 : m === "NOT_FOUND" ? 404 : 502,
      )
      .json({
        error:
          m === "INSUFFICIENT_BALANCE"
            ? "Insufficient balance"
            : m === "NOT_FOUND"
              ? "Merchant not found"
              : m === "WALLET_NOT_CONFIGURED"
                ? "Brale wallet is not configured"
                : providerError?.message ?? "Payment failed",
        providerCode: providerError?.code,
        providerRequestId: providerError?.requestId,
      });
  }
});
export default router;
