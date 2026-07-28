import { Router } from "express";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, merchantAlertsTable, merchantLoyaltyTransfersTable, merchantSettlementsTable, usersTable, walletTransactionsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireMerchantMembership, type MerchantAuthenticatedRequest } from "../middleware/merchant-identity";
import { parseOverviewRange } from "./merchant-overview-model";

const router = Router();
router.use(requireAuth, requireRole("Merchant"), requireMerchantMembership);
const number = (value: unknown) => Number(value ?? 0);

router.get("/merchant/overview", async (req: MerchantAuthenticatedRequest, res) => {
  let range;
  try { range = parseOverviewRange(req.query); }
  catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : "Invalid date range." }); return; }
  const merchant = req.merchant!;
  try {
    const [ledgerRows, transferRows, pendingTransfers, settlements, alerts, series] = await Promise.all([
      db.execute(sql`
        SELECT COALESCE(SUM(points_delta) FILTER (WHERE status = 'posted' AND entry_type = 'issuance' AND points_delta > 0 AND occurred_at >= ${range.from} AND occurred_at <= ${range.to}), 0) AS issued_period,
          COALESCE(-SUM(points_delta) FILTER (WHERE status = 'posted' AND entry_type = 'redemption' AND points_delta < 0 AND occurred_at >= ${range.from} AND occurred_at <= ${range.to}), 0) AS redeemed_period,
          COALESCE(SUM(points_delta) FILTER (WHERE status = 'posted'), 0) AS in_circulation,
          COALESCE(SUM(reserve_delta_cents) FILTER (WHERE status = 'posted'), 0) AS net_float_cents
        FROM merchant_loyalty_ledger_entries WHERE merchant_id = ${merchant.merchantId}`),
      db.execute(sql`
        SELECT COALESCE(SUM(points) FILTER (WHERE source_merchant_id = ${merchant.merchantId} AND status = 'completed'), 0) AS out_points,
          COALESCE(SUM(points) FILTER (WHERE destination_merchant_id = ${merchant.merchantId} AND status = 'completed'), 0) AS in_points
        FROM merchant_loyalty_transfers WHERE status = 'completed' AND initiated_at >= ${range.from} AND initiated_at <= ${range.to}
          AND (${merchant.merchantId} = source_merchant_id OR ${merchant.merchantId} = destination_merchant_id)`),
      db.execute(sql`SELECT COUNT(*) AS count, COALESCE(SUM(points), 0) AS points FROM merchant_loyalty_transfers
        WHERE status = 'pending' AND (source_merchant_id = ${merchant.merchantId} OR destination_merchant_id = ${merchant.merchantId})`),
      db.select({ id: merchantSettlementsTable.id, status: merchantSettlementsTable.status, periodEnd: merchantSettlementsTable.periodEnd, netFloatCents: merchantSettlementsTable.netFloatCents, settledAt: merchantSettlementsTable.settledAt })
        .from(merchantSettlementsTable).where(and(eq(merchantSettlementsTable.merchantId, merchant.merchantId), inArray(merchantSettlementsTable.status, ["draft", "pending", "processing", "settled"]))).orderBy(desc(merchantSettlementsTable.periodEnd)).limit(10),
      db.select({ severity: merchantAlertsTable.severity, title: merchantAlertsTable.title, message: merchantAlertsTable.message, createdAt: merchantAlertsTable.createdAt, actionPath: merchantAlertsTable.actionPath })
        .from(merchantAlertsTable).where(and(eq(merchantAlertsTable.merchantId, merchant.merchantId), inArray(merchantAlertsTable.state, ["open", "read"]))).orderBy(desc(merchantAlertsTable.createdAt)).limit(20),
      db.execute(sql`
        SELECT date_trunc('day', occurred_at) AS date,
          COALESCE(SUM(points_delta) FILTER (WHERE status = 'posted' AND entry_type = 'issuance' AND points_delta > 0), 0) AS issued_points,
          COALESCE(-SUM(points_delta) FILTER (WHERE status = 'posted' AND entry_type = 'redemption' AND points_delta < 0), 0) AS redeemed_points,
          COALESCE(SUM(points_delta) FILTER (WHERE status = 'posted' AND entry_type = 'transfer_in'), 0) AS transfer_in_points,
          COALESCE(-SUM(points_delta) FILTER (WHERE status = 'posted' AND entry_type = 'transfer_out'), 0) AS transfer_out_points
        FROM merchant_loyalty_ledger_entries WHERE merchant_id = ${merchant.merchantId} AND occurred_at >= ${range.from} AND occurred_at <= ${range.to}
        GROUP BY date_trunc('day', occurred_at) ORDER BY date_trunc('day', occurred_at) ASC`),
    ]);
    const ledger = ledgerRows.rows[0] ?? {}; const transfers = transferRows.rows[0] ?? {}; const pending = pendingTransfers.rows[0] ?? {};
    const activeSettlements = settlements.filter((settlement) => settlement.status !== "settled");
    const latestSettlement = settlements.find((settlement) => settlement.status === "settled") ?? null;
    const nextSettlement = [...activeSettlements].sort((a, b) => a.periodEnd.getTime() - b.periodEnd.getTime())[0] ?? null;
    res.json({ merchant: { code: merchant.merchantCode, name: merchant.merchantName }, range: { key: range.key, from: range.from.toISOString(), to: range.to.toISOString() },
      metrics: { rwloIssued: number(ledger.issued_period), rwloRedeemed: number(ledger.redeemed_period), rwloInCirculation: number(ledger.in_circulation), netFloatCents: number(ledger.net_float_cents), netFloatLabel: "Reserved funds supporting outstanding merchant-issued RWLO.", netFloatBasis: "Sum of posted reserve delta cents; it is not yield, revenue, or investment performance." },
      transfers: { inPoints: number(transfers.in_points), outPoints: number(transfers.out_points), pendingCount: number(pending.count), pendingPoints: number(pending.points) },
      settlements: { latest: latestSettlement && { status: latestSettlement.status, periodEnd: latestSettlement.periodEnd.toISOString(), netFloatCents: latestSettlement.netFloatCents, settledAt: latestSettlement.settledAt?.toISOString() ?? null }, next: nextSettlement && { status: nextSettlement.status, periodEnd: nextSettlement.periodEnd.toISOString(), netFloatCents: nextSettlement.netFloatCents }, pendingCount: activeSettlements.length, pendingAmountCents: activeSettlements.reduce((sum, settlement) => sum + settlement.netFloatCents, 0) },
      alerts: alerts.map((alert) => ({ ...alert, createdAt: alert.createdAt.toISOString() })),
      timeSeries: series.rows.map((row) => ({ date: new Date(String(row.date)).toISOString(), issuedPoints: number(row.issued_points), redeemedPoints: number(row.redeemed_points), transferInPoints: number(row.transfer_in_points), transferOutPoints: number(row.transfer_out_points) })),
    });
  } catch (error) { req.log.error({ error, merchantId: merchant.merchantId }, "Merchant overview query failed"); res.status(500).json({ error: "Merchant overview could not be loaded." }); }
});

router.get("/merchant/transfers", async (req: MerchantAuthenticatedRequest, res) => {
  const merchant = req.merchant!;
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const pageSize = Math.min(100, Math.max(10, Number.parseInt(String(req.query.pageSize ?? "25"), 10) || 25));
  const offset = (page - 1) * pageSize;
  try {
    const [rows, summaryResult] = await Promise.all([
      db.select({
        id: walletTransactionsTable.id,
        status: walletTransactionsTable.status,
        amountCents: walletTransactionsTable.amountCents,
        currency: walletTransactionsTable.currency,
        reference: walletTransactionsTable.reference,
        externalTransactionId: walletTransactionsTable.externalTransactionId,
        blockchainHash: walletTransactionsTable.blockchainHash,
        description: walletTransactionsTable.description,
        createdAt: walletTransactionsTable.createdAt,
        payerFirstName: usersTable.firstName,
        payerLastName: usersTable.lastName,
        payerEmail: usersTable.email,
      }).from(walletTransactionsTable)
        .innerJoin(usersTable, eq(walletTransactionsTable.userId, usersTable.id))
        .where(and(
          eq(walletTransactionsTable.merchantId, merchant.merchantId),
          eq(walletTransactionsTable.type, "merchant_payment"),
        ))
        .orderBy(desc(walletTransactionsTable.createdAt))
        .limit(pageSize)
        .offset(offset),
      db.execute(sql`
        SELECT COUNT(*) AS total_count,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
          COALESCE(SUM(-amount_cents) FILTER (WHERE status = 'completed'), 0) AS received_cents,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
          COALESCE(SUM(-amount_cents) FILTER (WHERE status = 'pending'), 0) AS pending_cents
        FROM wallet_transactions
        WHERE merchant_id = ${merchant.merchantId} AND type = 'merchant_payment'
      `),
    ]);
    const summary = summaryResult.rows[0] ?? {};
    const total = number(summary.total_count);
    res.json({
      merchant: { code: merchant.merchantCode, name: merchant.merchantName },
      summary: {
        total,
        completedCount: number(summary.completed_count),
        receivedCents: number(summary.received_cents),
        pendingCount: number(summary.pending_count),
        pendingCents: number(summary.pending_cents),
      },
      transfers: rows.map((row) => ({
        ...row,
        // Wallet transactions are fan-centric debits. Merchant receipts are
        // presented as positive incoming amounts.
        amountCents: Math.abs(row.amountCents),
        payerName: `${row.payerFirstName} ${row.payerLastName}`.trim(),
        createdAt: row.createdAt.toISOString(),
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasMore: page * pageSize < total,
      },
    });
  } catch (error) {
    req.log.error({ error, merchantId: merchant.merchantId }, "Merchant transfers query failed");
    res.status(500).json({ error: "Merchant transfers could not be loaded." });
  }
});
export default router;
