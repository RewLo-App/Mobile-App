import { sql } from "drizzle-orm";
import { index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { walletProvisioningStatusEnum } from "./users";

export const merchantsTable = pgTable(
  "merchants",
  {
    id: serial("id").primaryKey(),
    merchantCode: text("merchant_code").notNull().unique(),
    merchantName: text("merchant_name").notNull(),
    email: text("email").notNull().unique(),
    description: text("description").notNull(),
    // Existing merchant custody identifier. It remains unique because each
    // merchant owns a distinct Brale destination address.
    braleAddressId: text("brale_address_id").unique(),
    // Brale managed-account and custodial-wallet identifiers mirror the
    // user wallet model so merchant provisioning is independently auditable.
    braleAccountId: text("brale_account_id"),
    braleWalletId: text("brale_wallet_id"),
    blockchainAddress: text("blockchain_address"),
    blockchainNetwork: text("blockchain_network"),
    walletProvisioningStatus: walletProvisioningStatusEnum("wallet_provisioning_status")
      .notNull()
      .default("not_requested"),
    walletProvisioningError: text("wallet_provisioning_error"),
    // Stable server-generated key used to retry a failed provider operation
    // without provisioning duplicate merchant wallets.
    walletProvisioningKey: text("wallet_provisioning_key"),
    walletProvisionedAt: timestamp("wallet_provisioned_at", { withTimezone: true }),
    rewloCashBalance: integer("rewlo_cash_balance").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("merchants_wallet_provisioning_status_idx").on(table.walletProvisioningStatus),
    index("merchants_blockchain_network_idx").on(table.blockchainNetwork),
    uniqueIndex("merchants_wallet_provisioning_key_unique")
      .on(table.walletProvisioningKey)
      .where(sql`${table.walletProvisioningKey} is not null`),
  ],
);

export type Merchant = typeof merchantsTable.$inferSelect;
export type InsertMerchant = typeof merchantsTable.$inferInsert;
