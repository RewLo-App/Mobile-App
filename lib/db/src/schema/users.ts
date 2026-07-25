import { index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { rolesTable } from "./roles";

export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);
export const walletProvisioningStatusEnum = pgEnum("wallet_provisioning_status", [
  "not_requested",
  "pending",
  "completed",
  // Kept while existing installations migrate to `completed`.
  "provisioned",
  "failed",
]);

export const usersTable = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    // `email` preserves the submitted address; normalizedEmail is the canonical login identity.
    email: text("email").notNull().unique(),
    normalizedEmail: text("normalized_email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phoneNumber: text("phone_number"),
    zipCode: text("zip_code").notNull(),
    passwordHash: text("password_hash").notNull(),
    // Registration assigns the Fan role explicitly; never rely on a role ID default.
    roleId: integer("role_id").notNull().references(() => rolesTable.id),
    rewloCashBalance: integer("rewlo_cash_balance").notNull().default(0),
    rewloPoints: integer("rewlo_points").notNull().default(2350),
    status: userStatusEnum("status").notNull().default("active"),
    primaryClubId: text("primary_club_id"),
    followedClubIds: text("followed_club_ids").notNull().default("[]"),
    // Brale calls this resource an Address. Its API response provides `id`,
    // `address`, and `transfer_types`; it has no separate wallet_id.
    braleAccountId: text("brale_account_id"),
    // Brale calls custodial wallets Addresses. Keep the provider wallet identifier
    // when it is supplied, rather than deriving it from a blockchain address.
    braleWalletId: text("brale_wallet_id"),
    braleAddressId: text("brale_address_id"),
    blockchainAddress: text("blockchain_address"),
    blockchainNetwork: text("blockchain_network"),
    walletProvisioningStatus: walletProvisioningStatusEnum("wallet_provisioning_status")
      .notNull()
      .default("not_requested"),
    walletProvisioningError: text("wallet_provisioning_error"),
    // Stable, server-generated UUID used for every retry of this provisioning job.
    walletProvisioningKey: text("wallet_provisioning_key"),
    walletProvisionedAt: timestamp("wallet_provisioned_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("users_normalized_email_unique").on(table.normalizedEmail),
    index("users_role_id_idx").on(table.roleId),
    index("users_wallet_provisioning_status_idx").on(table.walletProvisioningStatus),
    index("users_blockchain_network_idx").on(table.blockchainNetwork),
  ],
);

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  normalizedEmail: true,
  roleId: true,
  rewloCashBalance: true,
  rewloPoints: true,
  status: true,
  braleAccountId: true,
  braleWalletId: true,
  braleAddressId: true,
  blockchainAddress: true,
  blockchainNetwork: true,
  walletProvisioningStatus: true,
  walletProvisioningError: true,
  walletProvisioningKey: true,
  walletProvisionedAt: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
