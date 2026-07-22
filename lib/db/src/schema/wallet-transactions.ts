import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { merchantsTable } from "./merchants";
import { usersTable } from "./users";

export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", [
  "top_up",
  "send",
  "receive",
  "reward",
  "redeem",
  "merchant_payment",
  "mint",
  "burn",
  "transfer",
  "balance_check",
  "status_check",
]);

export const walletTransactionStatusEnum = pgEnum("wallet_transaction_status", [
  "pending",
  "completed",
  "failed",
  "reversed",
]);

export const walletTransactionsTable = pgTable(
  "wallet_transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    relatedUserId: integer("related_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    merchantId: integer("merchant_id").references(() => merchantsTable.id, { onDelete: "set null" }),
    type: walletTransactionTypeEnum("type").notNull(),
    status: walletTransactionStatusEnum("status").notNull().default("pending"),
    // Signed amount in cents: credits are positive and debits are negative.
    amountCents: integer("amount_cents").notNull().default(0),
    currency: text("currency").notNull().default("USD"),
    rewardPointsDelta: integer("reward_points_delta").notNull().default(0),
    reference: text("reference").notNull().unique(),
    externalTransactionId: text("external_transaction_id"),
    blockchainHash: text("blockchain_hash"),
    description: text("description"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("wallet_transactions_user_created_at_idx").on(table.userId, table.createdAt),
    index("wallet_transactions_merchant_created_at_idx").on(table.merchantId, table.createdAt),
    index("wallet_transactions_related_user_idx").on(table.relatedUserId),
  ],
);

export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactionsTable.$inferInsert;
