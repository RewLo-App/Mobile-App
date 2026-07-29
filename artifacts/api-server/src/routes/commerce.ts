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
import { getUncachableStripeClient } from "../stripeClient";
import { requireAuth, requireRole, type AuthenticatedRequest } from "../middleware/auth";
import { redeemOfferForUser } from "../services/redemption-service";
import { authenticatedUserId } from "../middleware/identity";

const router = Router();
router.use("/wallet", requireAuth, requireRole("Fan"));
router.use("/rewards", requireAuth, requireRole("Fan"));
router.use("/merchants", requireAuth, requireRole("Fan"));
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
  // "mint" is a behind-the-scenes Brale operation and is intentionally hidden from fans.
  const allowedTypes = new Set(["all", "send", "receive", "top_up", "reward_earned", "reward_redeemed", "merchant_payment", "burn"]);
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
        AND wt.type IN ('send','receive','top_up','reward','redeem','merchant_payment','burn')
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
    // Shared with assistant-drafted confirmations so both paths move money
    // through the identical validated Brale redemption flow.
    const result = await redeemOfferForUser(id, offerId);
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
// RewLo Pay agentic commerce: 1 loyalty point = 1 cent when applied to a payment.
const POINT_VALUE_CENTS = 1;

/**
 * Proposes the best combination of loyalty points and wallet cash for a
 * merchant payment. Never charges anything — the fan approves the plan at
 * checkout before /wallet/merchant-pay executes it.
 */
router.post("/wallet/pay-plan", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const amount = money(req.body?.amount);
  const code = String(req.body?.merchantCode ?? "").toUpperCase();
  if (!amount) {
    res.status(400).json({ error: "Enter a valid amount" });
    return;
  }
  const [user] = await db
    .select({ points: usersTable.rewloPoints, balanceCents: usersTable.rewloCashBalance })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  const [merchant] = await db
    .select({ name: merchantsTable.merchantName })
    .from(merchantsTable)
    .where(eq(merchantsTable.merchantCode, code));
  if (!user || !merchant) {
    res.status(404).json({ error: "Merchant not found" });
    return;
  }
  // Best combination: apply as many points as possible (capped at the bill),
  // cover the remainder with cash.
  const pointsToApply = Math.min(user.points, Math.floor(amount.cents / POINT_VALUE_CENTS));
  const pointsValueCents = pointsToApply * POINT_VALUE_CENTS;
  const remainderCents = amount.cents - pointsValueCents;
  // Cash covers what points can't; any final shortfall is funded by card via Stripe.
  const cashCents = Math.min(remainderCents, user.balanceCents);
  const cardCents = remainderCents - cashCents;
  res.json({
    merchant: merchant.name,
    amountCents: amount.cents,
    pointsToApply,
    pointsValueCents,
    cashCents,
    cardCents,
    pointsBalance: user.points,
    cashBalanceCents: user.balanceCents,
    rationale:
      cardCents > 0
        ? `Points and wallet cash cover $${((amount.cents - cardCents) / 100).toFixed(2)} — the remaining $${(cardCents / 100).toFixed(2)} is paid securely by card.`
        : pointsToApply === 0
          ? "You have no points to apply, so this payment uses cash only."
          : cashCents === 0
            ? `Your points fully cover this payment — no cash needed.`
            : `Applying ${pointsToApply.toLocaleString()} points saves you $${(pointsValueCents / 100).toFixed(2)} in cash.`,
  });
});

/**
 * Creates a Stripe Checkout session for the card-funded portion of a payment.
 * The dynamic per-payment amount is intentionally created inline — merchant
 * bills are arbitrary amounts, not catalog products.
 */
router.post("/wallet/stripe-checkout-session", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const amount = money(req.body?.amount);
  const code = String(req.body?.merchantCode ?? "").toUpperCase();
  const rawPoints = req.body?.pointsToApply;
  if (!amount) { res.status(400).json({ error: "Enter a valid amount" }); return; }
  if (rawPoints !== undefined && (!Number.isSafeInteger(rawPoints) || rawPoints < 0)) {
    res.status(400).json({ error: "pointsToApply must be a non-negative integer" });
    return;
  }
  const pointsToApply = (rawPoints as number | undefined) ?? 0;
  if (pointsToApply * POINT_VALUE_CENTS > amount.cents) {
    res.status(400).json({ error: "Points applied exceed the payment amount" });
    return;
  }
  const [user] = await db
    .select({ points: usersTable.rewloPoints, balanceCents: usersTable.rewloCashBalance })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  const [merchant] = await db
    .select({ name: merchantsTable.merchantName })
    .from(merchantsTable)
    .where(eq(merchantsTable.merchantCode, code));
  if (!user || !merchant) { res.status(404).json({ error: "Merchant not found" }); return; }
  if (user.points < pointsToApply) { res.status(409).json({ error: "Not enough points" }); return; }
  const remainderCents = amount.cents - pointsToApply * POINT_VALUE_CENTS;
  const cashCents = Math.min(remainderCents, user.balanceCents);
  const cardCents = remainderCents - cashCents;
  if (cardCents <= 0) {
    res.status(400).json({ error: "No card payment needed — points and cash cover this payment" });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    const baseUrl = `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: cardCents,
            product_data: { name: `RewLo Pay — ${merchant.name}` },
          },
        },
      ],
      metadata: {
        userId: id,
        merchantCode: code,
        amountCents: String(amount.cents),
        pointsToApply: String(pointsToApply),
        cashCents: String(cashCents),
        cardCents: String(cardCents),
      },
      success_url: `${baseUrl}/api/stripe/return?status=success`,
      cancel_url: `${baseUrl}/api/stripe/return?status=cancelled`,
    });
    res.status(201).json({ sessionId: session.id, url: session.url, cardCents });
  } catch (e) {
    req.log.error({ e }, "Stripe checkout session creation failed");
    res.status(502).json({ error: "Could not start card payment" });
  }
});

/**
 * Completes a card-assisted payment after the fan pays the Stripe Checkout
 * session. Verifies the session is paid, then settles points + wallet cash and
 * credits the merchant in one transaction. Idempotent by session id.
 */
router.post("/wallet/stripe-checkout-complete", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const sessionId = String(req.body?.sessionId ?? "");
  if (!sessionId.startsWith("cs_")) {
    res.status(400).json({ error: "A valid sessionId is required" });
    return;
  }
  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = session.metadata ?? {};
    if (meta.userId !== String(id)) { res.status(404).json({ error: "Payment session not found" }); return; }
    if (session.payment_status !== "paid") {
      res.status(409).json({ error: "Card payment not completed yet", paymentStatus: session.payment_status });
      return;
    }
    const totalCents = Number(meta.amountCents);
    const pointsToApply = Number(meta.pointsToApply);
    const cashCents = Number(meta.cashCents);
    const cardCents = Number(meta.cardCents);
    const code = String(meta.merchantCode ?? "");
    if (![totalCents, pointsToApply, cashCents, cardCents].every(Number.isSafeInteger) || session.amount_total !== cardCents) {
      res.status(409).json({ error: "Payment session data mismatch" });
      return;
    }
    const result = await db.transaction(async (tx) => {
      // Lock the user row FIRST so concurrent completions serialize, then the
      // idempotency check below reliably sees any prior settlement.
      const locked = await tx.execute(
        sql`SELECT id, rewlo_cash_balance, rewlo_points FROM users WHERE id=${id} FOR UPDATE`,
      );
      // Idempotency: a completed session settles exactly once.
      const prior = await tx.execute(
        sql`SELECT id FROM wallet_transactions WHERE reference=${`${sessionId}:payment`} LIMIT 1`,
      );
      if (prior.rows[0]) return { alreadySettled: true };
      const user = locked.rows[0] as { rewlo_cash_balance: number; rewlo_points: number } | undefined;
      const [merchant] = await tx.select().from(merchantsTable).where(eq(merchantsTable.merchantCode, code));
      if (!user || !merchant) throw new Error("NOT_FOUND");
      if (user.rewlo_cash_balance < cashCents) throw new Error("INSUFFICIENT_BALANCE");
      if (user.rewlo_points < pointsToApply) throw new Error("INSUFFICIENT_POINTS");
      await tx
        .update(usersTable)
        .set({
          rewloCashBalance: sql`${usersTable.rewloCashBalance}-${cashCents}`,
          ...(pointsToApply > 0 ? { rewloPoints: sql`${usersTable.rewloPoints}-${pointsToApply}` } : {}),
        })
        .where(eq(usersTable.id, id));
      await tx
        .update(merchantsTable)
        .set({ rewloCashBalance: sql`${merchantsTable.rewloCashBalance}+${totalCents}` })
        .where(eq(merchantsTable.id, merchant.id));
      await tx.insert(walletTransactionsTable).values({
        userId: id,
        merchantId: merchant.id,
        type: "merchant_payment",
        status: "completed",
        amountCents: -cashCents,
        reference: `${sessionId}:payment`,
        externalTransactionId: typeof session.payment_intent === "string" ? session.payment_intent : null,
        description:
          `Payment to ${merchant.merchantName} ($${(cardCents / 100).toFixed(2)} by card` +
          (pointsToApply > 0 ? `, ${pointsToApply.toLocaleString()} pts applied)` : ")"),
        metadata: {
          provider: "stripe",
          stripeSessionId: sessionId,
          pointsApplied: pointsToApply,
          pointsValueCents: pointsToApply * POINT_VALUE_CENTS,
          cashCents,
          cardCents,
          totalCents,
        },
      });
      if (pointsToApply > 0) {
        await tx.insert(rewardTransactionsTable).values({
          userId: id,
          pointsDelta: -pointsToApply,
          reason: `Points applied to payment at ${merchant.merchantName}`,
          reference: `${sessionId}:points`,
        });
      }
      return {
        alreadySettled: false,
        reference: sessionId,
        merchant: merchant.merchantName,
        amount: (totalCents / 100).toFixed(2),
        cashCents,
        cardCents,
        pointsApplied: pointsToApply,
        balanceCents: user.rewlo_cash_balance - cashCents,
        pointsBalance: user.rewlo_points - pointsToApply,
      };
    });
    res.status(result.alreadySettled ? 200 : 201).json(result);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    req.log.error({ e }, "Stripe checkout completion failed");
    // The wallet split was frozen when the session was created. If the fan's
    // points/cash have since dropped below it, the card charge is refunded so
    // they are never charged without a settled payment.
    if (m === "INSUFFICIENT_BALANCE" || m === "INSUFFICIENT_POINTS") {
      let refunded = false;
      try {
        const stripe = await getUncachableStripeClient();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (typeof session.payment_intent === "string") {
          await stripe.refunds.create({ payment_intent: session.payment_intent });
          refunded = true;
        }
      } catch (refundError) {
        req.log.error({ refundError, sessionId }, "Automatic refund after failed settlement did not succeed");
      }
      res.status(409).json({
        error:
          (m === "INSUFFICIENT_BALANCE"
            ? "Your wallet balance changed since this payment was planned"
            : "Your points balance changed since this payment was planned") +
          (refunded
            ? " — the card payment has been refunded. Please try again."
            : " — we could not refund the card payment automatically; please contact support."),
        refunded,
      });
      return;
    }
    res.status(m === "NOT_FOUND" ? 404 : 502).json({
      error: m === "NOT_FOUND" ? "Merchant not found" : "Could not complete card payment",
    });
  }
});

router.post("/wallet/merchant-pay", async (req: AuthenticatedRequest, res) => {
  const id = authenticatedUserId(req)!;
  const amount = money(req.body?.amount);
  const code = String(req.body?.merchantCode ?? "").toUpperCase();
  const rawPoints = req.body?.pointsToApply;
  if (rawPoints !== undefined && (!Number.isSafeInteger(rawPoints) || rawPoints < 0)) {
    res.status(400).json({ error: "pointsToApply must be a non-negative integer" });
    return;
  }
  const pointsToApply = (rawPoints as number | undefined) ?? 0;
  if (!id) {
    res.status(401).json({ error: "User identity is required" });
    return;
  }
  if (!amount) {
    res.status(400).json({ error: "Enter a valid amount" });
    return;
  }
  const pointsValueCents = pointsToApply * POINT_VALUE_CENTS;
  if (pointsValueCents > amount.cents) {
    res.status(400).json({ error: "Points applied exceed the payment amount" });
    return;
  }
  const cashCents = amount.cents - pointsValueCents;
  const cashText = (cashCents / 100).toFixed(2);
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
    if (preflightUser.balanceCents < cashCents) throw new Error("INSUFFICIENT_BALANCE");
    if (pointsToApply > 0) {
      const [pointsUser] = await db
        .select({ points: usersTable.rewloPoints })
        .from(usersTable)
        .where(eq(usersTable.id, id));
      if (!pointsUser || pointsUser.points < pointsToApply) throw new Error("INSUFFICIENT_POINTS");
    }
    if (cashCents > 0 && (!preflightUser.braleAddressId || !preflightMerchant.braleAddressId))
      throw new Error("WALLET_NOT_CONFIGURED");

    const reference = randomUUID();
    // Only the cash portion moves on-chain; the points portion is a loyalty credit.
    const brale =
      cashCents > 0
        ? await new BraleService().transferStablecoin({
            userId: id,
            // Non-null: WALLET_NOT_CONFIGURED is thrown above when cashCents > 0 and either is missing.
            sourceAddressId: preflightUser.braleAddressId!,
            destinationAddressId: preflightMerchant.braleAddressId!,
            amount: { value: cashText, currency: "USD" },
            idempotencyKey: reference,
          })
        : null;

    const result = await db.transaction(async (tx) => {
      const locked = await tx.execute(
        sql`SELECT id, rewlo_cash_balance, rewlo_points, brale_address_id FROM users WHERE id=${id} FOR UPDATE`,
      );
      const user = locked.rows[0] as
        | { rewlo_cash_balance: number; rewlo_points: number; brale_address_id: string | null }
        | undefined;
      const [merchant] = await tx
        .select()
        .from(merchantsTable)
        .where(eq(merchantsTable.merchantCode, code));
      if (!user || !merchant) throw new Error("NOT_FOUND");
      if (user.rewlo_cash_balance < cashCents)
        throw new Error("INSUFFICIENT_BALANCE");
      if (user.rewlo_points < pointsToApply)
        throw new Error("INSUFFICIENT_POINTS");
      if (cashCents > 0 && (!user.brale_address_id || !merchant.braleAddressId))
        throw new Error("WALLET_NOT_CONFIGURED");
      await tx
        .update(usersTable)
        .set({
          rewloCashBalance: sql`${usersTable.rewloCashBalance}-${cashCents}`,
          ...(pointsToApply > 0
            ? { rewloPoints: sql`${usersTable.rewloPoints}-${pointsToApply}` }
            : {}),
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
          amountCents: -cashCents,
          reference: `${reference}:payment`,
          externalTransactionId: externalId(brale),
          description:
            pointsToApply > 0
              ? `Payment to ${merchant.merchantName} (${pointsToApply.toLocaleString()} pts applied)`
              : `Payment to ${merchant.merchantName}`,
          metadata: {
            provider: "brale",
            braleResponse: brale,
            pointsApplied: pointsToApply,
            pointsValueCents,
            totalCents: amount.cents,
          },
        });
      if (pointsToApply > 0) {
        await tx.insert(rewardTransactionsTable).values({
          userId: id,
          pointsDelta: -pointsToApply,
          reason: `Points applied to payment at ${merchant.merchantName}`,
          reference: `${reference}:points`,
        });
      }
      return {
        reference,
        merchant: merchant.merchantName,
        amount: amount.text,
        cashCents,
        pointsApplied: pointsToApply,
        balanceCents: user.rewlo_cash_balance - cashCents,
        pointsBalance: user.rewlo_points - pointsToApply,
        externalTransactionId: externalId(brale),
      };
    });
    res.status(201).json(result);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const providerError = e instanceof BraleApiError ? e : null;
    res
      .status(
        m === "INSUFFICIENT_BALANCE" || m === "INSUFFICIENT_POINTS" || m === "WALLET_NOT_CONFIGURED" ? 409 : m === "NOT_FOUND" ? 404 : 502,
      )
      .json({
        error:
          m === "INSUFFICIENT_BALANCE"
            ? "Insufficient balance"
            : m === "INSUFFICIENT_POINTS"
              ? "Not enough points"
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
