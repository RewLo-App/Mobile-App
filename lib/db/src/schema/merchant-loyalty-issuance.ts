import { z } from "zod/v4";
import { check, index, integer, jsonb, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { merchantsTable } from "./merchants";
import { usersTable } from "./users";
import { merchantLoyaltyLedgerEntriesTable } from "./merchant-loyalty";

export const merchantLoyaltyRuleTypeEnum = pgEnum("merchant_loyalty_rule_type", ["per_dollar", "per_visit", "campaign"]);
export const merchantLoyaltyRuleStatusEnum = pgEnum("merchant_loyalty_rule_status", ["draft", "active", "paused", "expired", "archived"]);
export const merchantCampaignStatusEnum = pgEnum("merchant_campaign_status", ["draft", "scheduled", "active", "paused", "ended", "archived"]);
export const merchantCampaignIssuanceStatusEnum = pgEnum("merchant_campaign_issuance_status", ["posted", "failed", "reversed"]);

/** Campaign counters are updated only in the same transaction as the ledger issuance. */
export const merchantLoyaltyCampaignsTable = pgTable("merchant_loyalty_campaigns", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: merchantCampaignStatusEnum("status").notNull().default("draft"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  pointsBudget: integer("points_budget").notNull(),
  pointsIssued: integer("points_issued").notNull().default(0),
  eligibility: jsonb("eligibility").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  check("merchant_campaign_budget_valid", sql`${table.pointsBudget} >= 0`),
  check("merchant_campaign_issued_valid", sql`${table.pointsIssued} >= 0`),
  check("merchant_campaign_cap_enforced", sql`${table.pointsIssued} <= ${table.pointsBudget}`),
  uniqueIndex("merchant_campaigns_merchant_name_unique").on(table.merchantId, table.name),
  index("merchant_campaigns_merchant_status_dates_idx").on(table.merchantId, table.status, table.startsAt, table.endsAt),
]);

/** A content edit is a new version row; `ruleKey` links that historical chain. */
export const merchantLoyaltyRulesTable = pgTable("merchant_loyalty_rules", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  ruleKey: text("rule_key").notNull(),
  version: integer("version").notNull().default(1),
  supersedesRuleId: integer("supersedes_rule_id").references((): AnyPgColumn => merchantLoyaltyRulesTable.id),
  name: text("name").notNull(),
  ruleType: merchantLoyaltyRuleTypeEnum("rule_type").notNull(),
  status: merchantLoyaltyRuleStatusEnum("status").notNull().default("draft"),
  priority: integer("priority").notNull().default(0),
  pointsNumerator: integer("points_numerator"),
  spendDenominatorCents: integer("spend_denominator_cents"),
  pointsPerVisit: integer("points_per_visit"),
  campaignId: integer("campaign_id").references(() => merchantLoyaltyCampaignsTable.id),
  conditions: jsonb("conditions").notNull().default({}),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("merchant_loyalty_rules_key_version_unique").on(table.merchantId, table.ruleKey, table.version),
  index("merchant_loyalty_rules_merchant_status_priority_idx").on(table.merchantId, table.status, table.priority),
  index("merchant_loyalty_rules_campaign_idx").on(table.campaignId),
]);

/** Per-recipient issuance history. Its idempotency key prevents duplicate credits. */
export const merchantCampaignIssuancesTable = pgTable("merchant_campaign_issuances", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  campaignId: integer("campaign_id").notNull().references(() => merchantLoyaltyCampaignsTable.id),
  fanUserId: integer("fan_user_id").notNull().references(() => usersTable.id),
  ledgerEntryId: integer("ledger_entry_id").references(() => merchantLoyaltyLedgerEntriesTable.id),
  issuedPoints: integer("issued_points").notNull(),
  status: merchantCampaignIssuanceStatusEnum("status").notNull().default("posted"),
  sourceEventKey: text("source_event_key"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  metadata: jsonb("metadata").notNull().default({}),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("merchant_campaign_issuance_points_positive", sql`${table.issuedPoints} > 0`),
  uniqueIndex("merchant_campaign_issuances_campaign_fan_event_unique").on(table.campaignId, table.fanUserId, table.sourceEventKey),
  index("merchant_campaign_issuances_merchant_issued_idx").on(table.merchantId, table.issuedAt),
  index("merchant_campaign_issuances_campaign_status_issued_idx").on(table.campaignId, table.status, table.issuedAt),
]);

export const pointValuePreviewSchema = z.object({
  version: z.number().int().positive(),
  label: z.string().min(1).max(120),
  unit: z.literal("RWLO"),
  pointsPerUnit: z.number().int().positive(),
  disclaimer: z.string().min(1).max(500),
}).strict();

export const loyaltyRuleInputSchema = z.object({
  name: z.string().trim().min(1).max(160), ruleType: z.enum(["per_dollar", "per_visit", "campaign"]), priority: z.number().int().min(0).max(10_000).default(0),
  pointsNumerator: z.number().int().positive().optional(), spendDenominatorCents: z.number().int().positive().optional(), pointsPerVisit: z.number().int().positive().optional(), campaignId: z.number().int().positive().optional(), conditions: z.record(z.string(), z.unknown()).default({}),
}).superRefine((rule, context) => {
  if (rule.ruleType === "per_dollar" && (!rule.pointsNumerator || !rule.spendDenominatorCents)) context.addIssue({ code: "custom", message: "Per-dollar rules require integer point and cent rate values." });
  if (rule.ruleType === "per_visit" && !rule.pointsPerVisit) context.addIssue({ code: "custom", message: "Per-visit rules require pointsPerVisit." });
  if (rule.ruleType === "campaign" && !rule.campaignId) context.addIssue({ code: "custom", message: "Campaign rules require campaignId." });
});

export const loyaltyCampaignInputSchema = z.object({
  name: z.string().trim().min(1).max(160), description: z.string().max(2_000).default(""), pointsBudget: z.number().int().nonnegative(),
  startsAt: z.date().optional(), endsAt: z.date().optional(), eligibility: z.record(z.string(), z.unknown()).default({}),
}).refine((campaign) => !campaign.startsAt || !campaign.endsAt || campaign.endsAt >= campaign.startsAt, { message: "Campaign end must be after its start." });
