import { relations } from "drizzle-orm";
import { passwordResetTokensTable, refreshTokensTable } from "./auth-tokens";
import { rolesTable } from "./roles";
import { usersTable } from "./users";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  role: one(rolesTable, { fields: [usersTable.roleId], references: [rolesTable.id] }),
  refreshTokens: many(refreshTokensTable),
  passwordResetTokens: many(passwordResetTokensTable),
}));

export const rolesRelations = relations(rolesTable, ({ many }) => ({
  users: many(usersTable),
}));

export const refreshTokensRelations = relations(refreshTokensTable, ({ one }) => ({
  user: one(usersTable, { fields: [refreshTokensTable.userId], references: [usersTable.id] }),
  replacedByToken: one(refreshTokensTable, {
    fields: [refreshTokensTable.replacedByTokenId],
    references: [refreshTokensTable.id],
    relationName: "refresh_token_rotation",
  }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokensTable, ({ one }) => ({
  user: one(usersTable, { fields: [passwordResetTokensTable.userId], references: [usersTable.id] }),
}));
