import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const offerCategoriesTable = pgTable("offer_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
});
export const offersTable = pgTable("offers", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => offerCategoriesTable.id),
  merchant: text("merchant").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  discountLabel: text("discount_label").notNull(),
  pointsRequired: integer("points_required").notNull(),
  redemptionValueCents: integer("redemption_value_cents")
    .notNull()
    .default(100),
  available: boolean("available").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const offerRedemptionsTable = pgTable(
  "offer_redemptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    offerId: integer("offer_id")
      .notNull()
      .references(() => offersTable.id),
    pointsSpent: integer("points_spent").notNull(),
    reference: text("reference").notNull().unique(),
    braleTransactionId: text("brale_transaction_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("offer_redemptions_user_offer_unique").on(t.userId, t.offerId),
  ],
);
export const rewardTransactionsTable = pgTable(
  "reward_transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    pointsDelta: integer("points_delta").notNull(),
    reason: text("reason").notNull(),
    reference: text("reference").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reward_transactions_user_created_idx").on(t.userId, t.createdAt),
  ],
);
export const appSettingsTable = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});
