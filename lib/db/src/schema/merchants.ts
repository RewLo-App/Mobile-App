import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const merchantsTable = pgTable("merchants", {
  id: serial("id").primaryKey(),
  merchantCode: text("merchant_code").notNull().unique(),
  merchantName: text("merchant_name").notNull(),
  email: text("email").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Merchant = typeof merchantsTable.$inferSelect;
export type InsertMerchant = typeof merchantsTable.$inferInsert;
