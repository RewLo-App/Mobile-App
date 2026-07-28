import { index, integer, pgEnum, pgTable, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { merchantsTable } from "./merchants";
import { usersTable } from "./users";

export const merchantUserRoleEnum = pgEnum("merchant_user_role", ["owner", "admin", "analyst", "operator"]);
export const merchantUserStatusEnum = pgEnum("merchant_user_status", ["active", "invited", "suspended"]);

/** Maps an authenticated Merchant-role user to the merchant data they may access. */
export const merchantUsersTable = pgTable("merchant_users", {
  id: serial("id").primaryKey(),
  merchantId: integer("merchant_id").notNull().references(() => merchantsTable.id),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: merchantUserRoleEnum("role").notNull().default("analyst"),
  status: merchantUserStatusEnum("status").notNull().default("invited"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("merchant_users_merchant_user_unique").on(table.merchantId, table.userId),
  index("merchant_users_user_status_idx").on(table.userId, table.status),
  index("merchant_users_merchant_status_idx").on(table.merchantId, table.status),
]);
