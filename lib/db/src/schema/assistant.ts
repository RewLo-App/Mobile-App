import {
  boolean,
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
import { offersTable } from "./rewards";
import { usersTable } from "./users";

/** Lifecycle of an in-app nudge surfaced on the home feed / bell. */
export const nudgeStatusEnum = pgEnum("nudge_status", [
  "pending",
  "seen",
  "accepted",
  "dismissed",
]);

export const nudgesTable = pgTable(
  "assistant_nudges",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // Stable pattern key (e.g. "expiring_offer:12") so the engine never
    // re-creates a nudge the fan already dismissed.
    patternKey: text("pattern_key").notNull(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    offerId: integer("offer_id").references(() => offersTable.id, { onDelete: "cascade" }),
    status: nudgeStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    index("assistant_nudges_user_status_idx").on(t.userId, t.status),
    // DB-level idempotency: a pattern fires at most once per fan, ever.
    uniqueIndex("assistant_nudges_user_pattern_unique").on(t.userId, t.patternKey),
  ],
);

export const assistantRulesTable = pgTable(
  "assistant_rules",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // The fan's plain-language instruction, kept verbatim.
    ruleText: text("rule_text").notNull(),
    // AI-parsed constraints: { categories, merchants, maxPointsCost, keywords, summary }
    parsed: jsonb("parsed").notNull().default({}),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assistant_rules_user_idx").on(t.userId)],
);

/** Drafted redemptions always wait for explicit fan confirmation — never auto-paid. */
export const draftedActionStatusEnum = pgEnum("drafted_action_status", [
  "proposed",
  "confirmed",
  "dismissed",
  "expired",
]);

export const draftedActionsTable = pgTable(
  "assistant_drafted_actions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    ruleId: integer("rule_id")
      .notNull()
      .references(() => assistantRulesTable.id, { onDelete: "cascade" }),
    offerId: integer("offer_id")
      .notNull()
      .references(() => offersTable.id, { onDelete: "cascade" }),
    summary: text("summary").notNull(),
    status: draftedActionStatusEnum("status").notNull().default("proposed"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    index("assistant_drafted_actions_user_status_idx").on(t.userId, t.status),
    // DB-level idempotency: a rule+offer pair is drafted at most once, ever.
    uniqueIndex("assistant_drafted_actions_rule_offer_unique").on(t.userId, t.ruleId, t.offerId),
  ],
);

export type Nudge = typeof nudgesTable.$inferSelect;
export type AssistantRule = typeof assistantRulesTable.$inferSelect;
export type DraftedAction = typeof draftedActionsTable.$inferSelect;
