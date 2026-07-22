import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { rolesTable } from "./roles";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phoneNumber: text("phone_number"),
  braleAddressId: text("brale_address_id").unique(),
  roleId: integer("role_id").references(() => rolesTable.id).notNull().default(1),
  // Monetary values are stored as integer cents to avoid floating-point errors.
  rewloCashBalance: integer("rewlo_cash_balance").notNull().default(0),
  rewloRewardPoints: integer("rewlo_reward_points").notNull().default(0),
  primaryClubId: text("primary_club_id").notNull(),
  followedClubIds: text("followed_club_ids").notNull().default("[]"),
  zip: text("zip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
