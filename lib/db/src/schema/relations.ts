import { relations } from "drizzle-orm";
import { passwordResetTokensTable, refreshTokensTable } from "./auth-tokens";
import { rolesTable } from "./roles";
import { usersTable } from "./users";
import { merchantsTable } from "./merchants";
import { merchantAlertsTable, merchantLoyaltyLedgerEntriesTable, merchantLoyaltyTransfersTable, merchantSettlementsTable } from "./merchant-loyalty";
import { merchantUsersTable } from "./merchant-users";
import { merchantCampaignIssuancesTable, merchantLoyaltyCampaignsTable, merchantLoyaltyRulesTable } from "./merchant-loyalty-issuance";

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  role: one(rolesTable, { fields: [usersTable.roleId], references: [rolesTable.id] }),
  refreshTokens: many(refreshTokensTable),
  passwordResetTokens: many(passwordResetTokensTable),
  merchantLoyaltyEntries: many(merchantLoyaltyLedgerEntriesTable),
  merchantMemberships: many(merchantUsersTable),
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

export const merchantsRelations = relations(merchantsTable, ({ many }) => ({
  loyaltyLedgerEntries: many(merchantLoyaltyLedgerEntriesTable),
  sourceTransfers: many(merchantLoyaltyTransfersTable, { relationName: "merchant_transfer_source" }),
  destinationTransfers: many(merchantLoyaltyTransfersTable, { relationName: "merchant_transfer_destination" }),
  settlements: many(merchantSettlementsTable),
  alerts: many(merchantAlertsTable),
  members: many(merchantUsersTable),
  loyaltyRules: many(merchantLoyaltyRulesTable),
  loyaltyCampaigns: many(merchantLoyaltyCampaignsTable),
  campaignIssuances: many(merchantCampaignIssuancesTable),
}));

export const merchantLoyaltyLedgerEntriesRelations = relations(merchantLoyaltyLedgerEntriesTable, ({ one }) => ({
  merchant: one(merchantsTable, { fields: [merchantLoyaltyLedgerEntriesTable.merchantId], references: [merchantsTable.id] }),
  fanUser: one(usersTable, { fields: [merchantLoyaltyLedgerEntriesTable.fanUserId], references: [usersTable.id] }),
}));

export const merchantLoyaltyTransfersRelations = relations(merchantLoyaltyTransfersTable, ({ one }) => ({
  sourceMerchant: one(merchantsTable, { fields: [merchantLoyaltyTransfersTable.sourceMerchantId], references: [merchantsTable.id], relationName: "merchant_transfer_source" }),
  destinationMerchant: one(merchantsTable, { fields: [merchantLoyaltyTransfersTable.destinationMerchantId], references: [merchantsTable.id], relationName: "merchant_transfer_destination" }),
}));

export const merchantSettlementsRelations = relations(merchantSettlementsTable, ({ one }) => ({
  merchant: one(merchantsTable, { fields: [merchantSettlementsTable.merchantId], references: [merchantsTable.id] }),
}));

export const merchantAlertsRelations = relations(merchantAlertsTable, ({ one }) => ({
  merchant: one(merchantsTable, { fields: [merchantAlertsTable.merchantId], references: [merchantsTable.id] }),
}));

export const merchantUsersRelations = relations(merchantUsersTable, ({ one }) => ({
  merchant: one(merchantsTable, { fields: [merchantUsersTable.merchantId], references: [merchantsTable.id] }),
  user: one(usersTable, { fields: [merchantUsersTable.userId], references: [usersTable.id] }),
}));

export const merchantLoyaltyCampaignsRelations = relations(merchantLoyaltyCampaignsTable, ({ one, many }) => ({
  merchant: one(merchantsTable, { fields: [merchantLoyaltyCampaignsTable.merchantId], references: [merchantsTable.id] }),
  rules: many(merchantLoyaltyRulesTable),
  issuances: many(merchantCampaignIssuancesTable),
}));

export const merchantLoyaltyRulesRelations = relations(merchantLoyaltyRulesTable, ({ one }) => ({
  merchant: one(merchantsTable, { fields: [merchantLoyaltyRulesTable.merchantId], references: [merchantsTable.id] }),
  campaign: one(merchantLoyaltyCampaignsTable, { fields: [merchantLoyaltyRulesTable.campaignId], references: [merchantLoyaltyCampaignsTable.id] }),
  supersedes: one(merchantLoyaltyRulesTable, { fields: [merchantLoyaltyRulesTable.supersedesRuleId], references: [merchantLoyaltyRulesTable.id], relationName: "rule_version_chain" }),
}));

export const merchantCampaignIssuancesRelations = relations(merchantCampaignIssuancesTable, ({ one }) => ({
  merchant: one(merchantsTable, { fields: [merchantCampaignIssuancesTable.merchantId], references: [merchantsTable.id] }),
  campaign: one(merchantLoyaltyCampaignsTable, { fields: [merchantCampaignIssuancesTable.campaignId], references: [merchantLoyaltyCampaignsTable.id] }),
  fanUser: one(usersTable, { fields: [merchantCampaignIssuancesTable.fanUserId], references: [usersTable.id] }),
  ledgerEntry: one(merchantLoyaltyLedgerEntriesTable, { fields: [merchantCampaignIssuancesTable.ledgerEntryId], references: [merchantLoyaltyLedgerEntriesTable.id] }),
}));
