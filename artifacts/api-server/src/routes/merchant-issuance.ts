import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "@workspace/api-zod";
import { db, appSettingsTable, merchantCampaignIssuancesTable, merchantLoyaltyCampaignsTable, merchantLoyaltyLedgerEntriesTable, merchantLoyaltyRulesTable, usersTable, loyaltyCampaignInputSchema, loyaltyRuleInputSchema, pointValuePreviewSchema } from "@workspace/db";
import { requireAuth, requireRole } from "../middleware/auth";
import { requireMerchantMembership, type MerchantAuthenticatedRequest } from "../middleware/merchant-identity";
import { bulkIssuanceSchema, previewBatch } from "./merchant-issuance-model";

const router = Router();
// Scoped to /merchant — an unscoped use() would run for every request passing
// through this router and 403 all Fan traffic mounted after it.
router.use("/merchant", requireAuth, requireRole("Merchant"), requireMerchantMembership);
const id = (value: unknown) => Number.parseInt(typeof value === "string" ? value : "", 10);
const status = z.enum(["draft", "active", "paused", "expired", "archived"]);
const campaignStatus = z.enum(["draft", "scheduled", "active", "paused", "ended", "archived"]);
const rulePatchSchema = loyaltyRuleInputSchema.partial().extend({ status: status.optional() }).strict();
const campaignPatchSchema = loyaltyCampaignInputSchema.partial().extend({ status: campaignStatus.optional() }).strict();
const date = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Date(value) : undefined;

async function valuePreview() {
  const [setting] = await db.select({ value: appSettingsTable.value }).from(appSettingsTable).where(eq(appSettingsTable.key, "rwlo_point_value_preview")).limit(1);
  const parsed = setting ? pointValuePreviewSchema.safeParse(JSON.parse(setting.value)) : null;
  return parsed?.success ? parsed.data : { version: 1, label: "RWLO programme points", unit: "RWLO" as const, pointsPerUnit: 1, disclaimer: "Programme value display only; not cash, yield, or an investment return." };
}
function rulesWhere(req: MerchantAuthenticatedRequest, ruleId: number) { return and(eq(merchantLoyaltyRulesTable.id, ruleId), eq(merchantLoyaltyRulesTable.merchantId, req.merchant!.merchantId)); }
function campaignsWhere(req: MerchantAuthenticatedRequest, campaignId: number) { return and(eq(merchantLoyaltyCampaignsTable.id, campaignId), eq(merchantLoyaltyCampaignsTable.merchantId, req.merchant!.merchantId)); }

router.get("/merchant/loyalty/rules", async (req: MerchantAuthenticatedRequest, res) => {
  res.json({ rules: await db.select().from(merchantLoyaltyRulesTable).where(eq(merchantLoyaltyRulesTable.merchantId, req.merchant!.merchantId)).orderBy(desc(merchantLoyaltyRulesTable.priority), desc(merchantLoyaltyRulesTable.createdAt)) });
});
router.post("/merchant/loyalty/rules", async (req: MerchantAuthenticatedRequest, res) => {
  const parsed = loyaltyRuleInputSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid rule." }); return; }
  const body = parsed.data; const [rule] = await db.insert(merchantLoyaltyRulesTable).values({ ...body, merchantId: req.merchant!.merchantId, ruleKey: randomUUID(), status: "draft" }).returning(); res.status(201).json({ rule });
});
router.patch("/merchant/loyalty/rules/:ruleId", async (req: MerchantAuthenticatedRequest, res) => {
  const ruleId = id(req.params.ruleId); const parsed = rulePatchSchema.safeParse(req.body); if (!ruleId || !parsed.success) { res.status(400).json({ error: parsed.success ? "Invalid rule ID." : parsed.error.issues[0]?.message ?? "Invalid rule." }); return; }
  const [current] = await db.select().from(merchantLoyaltyRulesTable).where(rulesWhere(req, ruleId)).limit(1); if (!current) { res.status(404).json({ error: "Rule not found." }); return; }
  const next = { ...current, ...parsed.data, id: undefined, createdAt: undefined, version: current.version + 1, supersedesRuleId: current.id, status: parsed.data.status ?? "draft" };
  const [rule] = await db.insert(merchantLoyaltyRulesTable).values(next).returning(); res.json({ rule, previousRuleId: current.id });
});
for (const [action, nextStatus] of [["pause", "paused"], ["resume", "active"], ["archive", "archived"]] as const) router.post(`/merchant/loyalty/rules/:ruleId/${action}`, async (req: MerchantAuthenticatedRequest, res) => {
  const ruleId = id(req.params.ruleId); const [current] = await db.select().from(merchantLoyaltyRulesTable).where(rulesWhere(req, ruleId)).limit(1); if (!current) { res.status(404).json({ error: "Rule not found." }); return; }
  const [rule] = await db.insert(merchantLoyaltyRulesTable).values({ ...current, id: undefined, createdAt: undefined, version: current.version + 1, supersedesRuleId: current.id, status: nextStatus }).returning(); res.json({ rule, previousRuleId: current.id });
});

router.get("/merchant/loyalty/campaigns", async (req: MerchantAuthenticatedRequest, res) => {
  const campaigns = await db.select().from(merchantLoyaltyCampaignsTable).where(eq(merchantLoyaltyCampaignsTable.merchantId, req.merchant!.merchantId)).orderBy(desc(merchantLoyaltyCampaignsTable.createdAt));
  res.json({ campaigns: campaigns.map((campaign) => ({ ...campaign, remainingPoints: campaign.pointsBudget - campaign.pointsIssued })) });
});
router.post("/merchant/loyalty/campaigns", async (req: MerchantAuthenticatedRequest, res) => {
  const parsed = loyaltyCampaignInputSchema.safeParse({ ...req.body, startsAt: date(req.body?.startsAt), endsAt: date(req.body?.endsAt) }); if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid campaign." }); return; }
  const [campaign] = await db.insert(merchantLoyaltyCampaignsTable).values({ ...parsed.data, merchantId: req.merchant!.merchantId, status: "draft" }).returning(); res.status(201).json({ campaign, remainingPoints: campaign.pointsBudget });
});
router.patch("/merchant/loyalty/campaigns/:campaignId", async (req: MerchantAuthenticatedRequest, res) => {
  const campaignId = id(req.params.campaignId); const parsed = campaignPatchSchema.safeParse({ ...req.body, startsAt: req.body?.startsAt === undefined ? undefined : date(req.body.startsAt), endsAt: req.body?.endsAt === undefined ? undefined : date(req.body.endsAt) }); if (!campaignId || !parsed.success) { res.status(400).json({ error: parsed.success ? "Invalid campaign ID." : parsed.error.issues[0]?.message ?? "Invalid campaign." }); return; }
  const [campaign] = await db.update(merchantLoyaltyCampaignsTable).set(parsed.data).where(campaignsWhere(req, campaignId)).returning(); if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; } res.json({ campaign, remainingPoints: campaign.pointsBudget - campaign.pointsIssued });
});
for (const [action, nextStatus] of [["schedule", "scheduled"], ["launch", "active"], ["pause", "paused"], ["end", "ended"]] as const) router.post(`/merchant/loyalty/campaigns/:campaignId/${action}`, async (req: MerchantAuthenticatedRequest, res) => { const campaignId = id(req.params.campaignId); const [campaign] = await db.update(merchantLoyaltyCampaignsTable).set({ status: nextStatus }).where(campaignsWhere(req, campaignId)).returning(); if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; } res.json({ campaign, remainingPoints: campaign.pointsBudget - campaign.pointsIssued }); });

router.post("/merchant/loyalty/preview", async (req: MerchantAuthenticatedRequest, res) => {
  const input = z.object({ campaignId: z.number().int().positive().optional(), ruleId: z.number().int().positive().optional(), spendCents: z.number().int().nonnegative().optional(), visits: z.number().int().nonnegative().optional(), points: z.number().int().positive().optional() }).strict().safeParse(req.body); if (!input.success) { res.status(400).json({ error: input.error.issues[0]?.message ?? "Invalid preview." }); return; }
  let estimated = input.data.points ?? 0; let warnings: string[] = [];
  if (input.data.ruleId) { const [rule] = await db.select().from(merchantLoyaltyRulesTable).where(rulesWhere(req, input.data.ruleId)).limit(1); if (!rule) { res.status(404).json({ error: "Rule not found." }); return; } if (rule.ruleType === "per_dollar") estimated = Math.floor((input.data.spendCents ?? 0) / (rule.spendDenominatorCents ?? 1)) * (rule.pointsNumerator ?? 0); else if (rule.ruleType === "per_visit") estimated = (input.data.visits ?? 0) * (rule.pointsPerVisit ?? 0); else if (rule.campaignId) input.data.campaignId = rule.campaignId; if (rule.status !== "active") warnings.push("This rule is not active."); }
  let campaign = null; if (input.data.campaignId) { [campaign] = await db.select().from(merchantLoyaltyCampaignsTable).where(campaignsWhere(req, input.data.campaignId)).limit(1); if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; } if (campaign.status !== "active") warnings.push("This campaign is not active."); if (estimated > campaign.pointsBudget - campaign.pointsIssued) warnings.push("Estimated issuance exceeds remaining campaign allocation."); }
  const preview = await valuePreview(); res.json({ estimatedPoints: estimated, campaignBudget: campaign && { budgetPoints: campaign.pointsBudget, issuedPoints: campaign.pointsIssued, remainingPoints: campaign.pointsBudget - campaign.pointsIssued, remainingAfterPreview: campaign.pointsBudget - campaign.pointsIssued - estimated }, valuePreview: { ...preview, estimatedUnits: estimated / preview.pointsPerUnit }, warnings });
});

router.post("/merchant/loyalty/bulk-issuance/preview", async (req: MerchantAuthenticatedRequest, res) => {
  const parsed = bulkIssuanceSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid bulk issuance." }); return; } const [campaign] = await db.select().from(merchantLoyaltyCampaignsTable).where(campaignsWhere(req, parsed.data.campaignId)).limit(1); if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; }
  const found = await db.select({ id: usersTable.id }).from(usersTable).where(sql`${usersTable.id} IN ${parsed.data.recipients.map((r) => r.userId)}`); const preview = previewBatch(parsed.data.recipients, campaign.pointsBudget - campaign.pointsIssued, new Set(found.map((user) => user.id))); res.json({ campaign: { id: campaign.id, remainingPoints: campaign.pointsBudget - campaign.pointsIssued }, ...preview, valuePreview: await valuePreview() });
});

router.post("/merchant/loyalty/bulk-issuance/commit", async (req: MerchantAuthenticatedRequest, res) => {
  const parsed = bulkIssuanceSchema.safeParse(req.body); if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid bulk issuance." }); return; }
  const merchantId = req.merchant!.merchantId; const input = parsed.data;
  try { const result = await db.transaction(async (tx) => {
    const locked = await tx.execute(sql`SELECT id, points_budget, points_issued, status FROM merchant_loyalty_campaigns WHERE id = ${input.campaignId} AND merchant_id = ${merchantId} FOR UPDATE`); const campaign = locked.rows[0] as { id: number; points_budget: number; points_issued: number; status: string } | undefined; if (!campaign) throw new Error("NOT_FOUND"); if (campaign.status !== "active") throw new Error("CAMPAIGN_INACTIVE");
    const found = await tx.select({ id: usersTable.id }).from(usersTable).where(sql`${usersTable.id} IN ${input.recipients.map((r) => r.userId)}`); const preview = previewBatch(input.recipients, campaign.points_budget - campaign.points_issued, new Set(found.map((user) => user.id))); let issued = 0; const results = [] as Array<Record<string, unknown>>;
    for (const item of preview.results) { if (item.status !== "ready") { results.push(item); continue; } const key = `${input.idempotencyKey}:${item.userId}`; const [existing] = await tx.select({ id: merchantCampaignIssuancesTable.id }).from(merchantCampaignIssuancesTable).where(eq(merchantCampaignIssuancesTable.idempotencyKey, key)).limit(1); if (existing) { results.push({ ...item, status: "duplicate", reason: "Idempotency key already processed", issuedPoints: 0 }); continue; }
      const [issuance] = await tx.insert(merchantCampaignIssuancesTable).values({ merchantId, campaignId: campaign.id, fanUserId: item.userId, issuedPoints: item.points, sourceEventKey: item.sourceEventKey, idempotencyKey: key, metadata: { batchIdempotencyKey: input.idempotencyKey } }).returning(); const [ledger] = await tx.insert(merchantLoyaltyLedgerEntriesTable).values({ merchantId, fanUserId: item.userId, entryType: "issuance", status: "posted", pointsDelta: item.points, reserveDeltaCents: 0, sourceType: "campaign_issuance", sourceId: String(issuance.id), idempotencyKey: `ledger:${key}`, externalReference: key, metadata: { campaignId: campaign.id, issuanceId: issuance.id } }).returning(); await tx.update(merchantCampaignIssuancesTable).set({ ledgerEntryId: ledger.id }).where(eq(merchantCampaignIssuancesTable.id, issuance.id)); issued += item.points; results.push({ ...item, status: "issued", reason: null, issuedPoints: item.points, issuanceId: issuance.id }); }
    if (issued) await tx.execute(sql`UPDATE merchant_loyalty_campaigns SET points_issued = points_issued + ${issued}, updated_at = now() WHERE id = ${campaign.id} AND points_issued + ${issued} <= points_budget`); return { issuedPoints: issued, remainingPoints: campaign.points_budget - campaign.points_issued - issued, results };
  }); res.status(201).json(result); } catch (error) { const code = error instanceof Error ? error.message : "ISSUANCE_FAILED"; const known: Record<string, [number, string]> = { NOT_FOUND: [404, "Campaign not found."], CAMPAIGN_INACTIVE: [409, "Campaign is not active."] }; const [http, message] = known[code] ?? [500, "Bulk issuance could not be completed."]; res.status(http).json({ error: message }); }
});
router.get("/merchant/loyalty/issuance-history", async (req: MerchantAuthenticatedRequest, res) => { const history = await db.select().from(merchantCampaignIssuancesTable).where(eq(merchantCampaignIssuancesTable.merchantId, req.merchant!.merchantId)).orderBy(desc(merchantCampaignIssuancesTable.issuedAt)).limit(100); res.json({ history }); });
router.get("/merchant/loyalty/campaigns/:campaignId/performance", async (req: MerchantAuthenticatedRequest, res) => { const campaignId = id(req.params.campaignId); const [campaign] = await db.select().from(merchantLoyaltyCampaignsTable).where(campaignsWhere(req, campaignId)).limit(1); if (!campaign) { res.status(404).json({ error: "Campaign not found." }); return; } const [summary] = await db.select({ issuanceCount: sql<number>`count(*)`, issuedPoints: sql<number>`coalesce(sum(${merchantCampaignIssuancesTable.issuedPoints}), 0)` }).from(merchantCampaignIssuancesTable).where(and(eq(merchantCampaignIssuancesTable.merchantId, req.merchant!.merchantId), eq(merchantCampaignIssuancesTable.campaignId, campaignId))); res.json({ campaign, issuanceCount: Number(summary?.issuanceCount ?? 0), issuedPoints: Number(summary?.issuedPoints ?? 0), remainingPoints: campaign.pointsBudget - campaign.pointsIssued }); });
export default router;
