import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userCardsTable = pgTable(
  "user_cards",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    cardHolder: text("card_holder").notNull(),
    last4Digits: text("last4_digits").notNull(),
    expiry: text("expiry").notNull(),
    cardType: text("card_type").notNull(),
    provider: text("provider").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
  },
  (table) => [uniqueIndex("user_cards_one_default_per_user").on(table.userId).where(sql`${table.isDefault}`)],
);

export type UserCard = typeof userCardsTable.$inferSelect;
export type InsertUserCard = typeof userCardsTable.$inferInsert;
