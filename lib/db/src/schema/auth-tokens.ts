import { type AnyPgColumn, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

/**
 * Refresh tokens are opaque bearer secrets. Store a SHA-256 (or stronger)
 * hash here, never the token value sent to a client.
 */
export const refreshTokensTable = pgTable(
  "refresh_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    // Generated once per login/session and retained across rotation.
    tokenFamily: text("token_family").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedByTokenId: integer("replaced_by_token_id").references(
      (): AnyPgColumn => refreshTokensTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("refresh_tokens_token_hash_unique").on(table.tokenHash),
    index("refresh_tokens_user_expires_at_idx").on(table.userId, table.expiresAt),
    index("refresh_tokens_family_created_at_idx").on(table.tokenFamily, table.createdAt),
  ],
);

/** Password-reset bearer secrets are one-time use and are stored only as hashes. */
export const passwordResetTokensTable = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_token_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_expires_at_idx").on(table.userId, table.expiresAt),
  ],
);

/** Records password-reset attempts even for unknown emails, enabling durable throttling. */
export const passwordResetRequestsTable = pgTable(
  "password_reset_requests",
  {
    id: serial("id").primaryKey(),
    normalizedEmail: text("normalized_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("password_reset_requests_email_created_at_idx").on(table.normalizedEmail, table.createdAt)],
);

/** Access-token denylist used to invalidate the current JWT at logout. */
export const revokedAccessTokensTable = pgTable(
  "revoked_access_tokens",
  {
    id: serial("id").primaryKey(),
    tokenId: text("token_id").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("revoked_access_tokens_token_id_unique").on(table.tokenId), index("revoked_access_tokens_expires_at_idx").on(table.expiresAt)],
);

export type RefreshToken = typeof refreshTokensTable.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokensTable.$inferSelect;
