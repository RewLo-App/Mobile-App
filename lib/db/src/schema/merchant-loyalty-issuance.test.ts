import assert from "node:assert/strict";
import test from "node:test";
import { loyaltyCampaignInputSchema, loyaltyRuleInputSchema, pointValuePreviewSchema } from "./merchant-loyalty-issuance";

test("per-dollar rules require integer point and cent rate values", () => {
  assert.equal(loyaltyRuleInputSchema.safeParse({ name: "Spend", ruleType: "per_dollar", pointsNumerator: 2, spendDenominatorCents: 100 }).success, true);
  assert.equal(loyaltyRuleInputSchema.safeParse({ name: "Spend", ruleType: "per_dollar", pointsNumerator: 2 }).success, false);
});

test("campaign input prevents invalid schedule and non-integer budget", () => {
  assert.equal(loyaltyCampaignInputSchema.safeParse({ name: "Campaign", pointsBudget: 1_000, startsAt: new Date("2026-07-01"), endsAt: new Date("2026-07-31") }).success, true);
  assert.equal(loyaltyCampaignInputSchema.safeParse({ name: "Campaign", pointsBudget: 12.5 }).success, false);
  assert.equal(loyaltyCampaignInputSchema.safeParse({ name: "Campaign", pointsBudget: 1_000, startsAt: new Date("2026-08-01"), endsAt: new Date("2026-07-01") }).success, false);
});

test("point value preview is a labelled programme display, not a money conversion", () => {
  const preview = pointValuePreviewSchema.parse({ version: 1, label: "RWLO programme points", unit: "RWLO", pointsPerUnit: 1, disclaimer: "Programme value display only; not cash or yield." });
  assert.equal(preview.unit, "RWLO");
  assert.equal(preview.pointsPerUnit, 1);
});
