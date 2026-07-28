import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { merchantsTable } from "./merchants";
import { usersTable } from "./users";

export const merchantLoyaltyEntryTypeEnum = pgEnum("merchant_loyalty_entry_type", [
  "issuance", "redemption", "transfer_in", "transfer_out", "expiration", "adjustment", "reversal",
]);
export const merchantLoyaltyEntryStatusEnum = pgEnum("merchant_loyalty_entry_status", ["pending", "posted", "reversed", "failed"]);
export const merchantTransferStatusEnum = pgEnum("merchant_transfer_status", ["pending", "completed", "failed", "reversed"]);
export const merchantSettlementStatusEnum = pgEnum("merchant_settlement_status", ["draft", "pending", "processing", "settled", "failed", "disputed"]);
export const merchantAlertSeverityEnum = pgEnum("merchant_alert_severity", ["info", "warning", "critical"]);
export const merchantAlertStateEnum = pgEnum("merchant_alert_state", ["open", "read", "resolved"]);

/**
 * Append-only merchant point liability ledger. `pointsDelta` and
 * `reserveDeltaCents` are signed integers: the latter expresses the change in
 * funds reserved for outstanding merchant-issued points, not yield or revenue.
 */
export const merchantLoyaltyLedgerEntriesTable = pgTable("merchant_loyalty_ledger_entries", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  fanUserId: integer("fan_user_id").references(() => usersTable.id, { onDelete: "set null" }),
  entryType: merchantLoyaltyEntryTypeEnum("entry_type").notNull(),
  status: merchantLoyaltyEntryStatusEnum("status").notNull().default("pending"),
  pointsDelta: integer("points_delta").notNull(),
  reserveDeltaCents: integer("reserve_delta_cents").notNull().default(0),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  externalReference: text("external_reference"),
  metadata: jsonb("metadata").notNull().default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("merchant_loyalty_ledger_merchant_occurred_idx").on(table.merchantId, table.occurredAt),
  index("merchant_loyalty_ledger_merchant_status_occurred_idx").on(table.merchantId, table.status, table.occurredAt),
  index("merchant_loyalty_ledger_fan_occurred_idx").on(table.fanUserId, table.occurredAt),
  uniqueIndex("merchant_loyalty_ledger_merchant_reference_unique").on(table.merchantId, table.externalReference),
]);

export const merchantLoyaltyTransfersTable = pgTable("merchant_loyalty_transfers", {
  id: serial("id").primaryKey(),
  sourceMerchantId: integer("source_merchant_id").notNull().references(() => merchantsTable.id),
  destinationMerchantId: integer("destination_merchant_id").notNull().references(() => merchantsTable.id),
  points: integer("points").notNull(),
  status: merchantTransferStatusEnum("status").notNull().default("pending"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  externalReference: text("external_reference"),
  metadata: jsonb("metadata").notNull().default({}),
  initiatedAt: timestamp("initiated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("merchant_transfers_source_status_initiated_idx").on(table.sourceMerchantId, table.status, table.initiatedAt),
  index("merchant_transfers_destination_status_initiated_idx").on(table.destinationMerchantId, table.status, table.initiatedAt),
]);

/** A settlement is an auditable period snapshot; the ledger remains the source of truth. */
export const merchantSettlementsTable = pgTable("merchant_settlements", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
  periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
  status: merchantSettlementStatusEnum("status").notNull().default("draft"),
  issuedPoints: integer("issued_points").notNull().default(0),
  redeemedPoints: integer("redeemed_points").notNull().default(0),
  transferInPoints: integer("transfer_in_points").notNull().default(0),
  transferOutPoints: integer("transfer_out_points").notNull().default(0),
  reserveContributionCents: integer("reserve_contribution_cents").notNull().default(0),
  reserveReleaseCents: integer("reserve_release_cents").notNull().default(0),
  netFloatCents: integer("net_float_cents").notNull().default(0),
  externalReference: text("external_reference"),
  failureReason: text("failure_reason"),
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("merchant_settlements_merchant_status_period_idx").on(table.merchantId, table.status, table.periodEnd),
  uniqueIndex("merchant_settlements_merchant_period_unique").on(table.merchantId, table.periodStart, table.periodEnd),
]);

export const merchantAlertsTable = pgTable("merchant_alerts", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  severity: merchantAlertSeverityEnum("severity").notNull().default("info"),
  category: text("category").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionPath: text("action_path"),
  state: merchantAlertStateEnum("state").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
}, (table) => [
  index("merchant_alerts_merchant_state_created_idx").on(table.merchantId, table.state, table.createdAt),
  index("merchant_alerts_merchant_severity_created_idx").on(table.merchantId, table.severity, table.createdAt),
]);
