import assert from "node:assert/strict";
import test from "node:test";
import { calculateMerchantLedgerMetrics, parseOverviewRange } from "./merchant-overview-model";
import { singleMerchantMembership } from "../middleware/merchant-scope";

test("merchant ledger calculations use only posted signed values", () => {
  const totals = calculateMerchantLedgerMetrics([
    { entryType: "issuance", status: "posted", pointsDelta: 1_000, reserveDeltaCents: 100 },
    { entryType: "redemption", status: "posted", pointsDelta: -250, reserveDeltaCents: -25 },
    { entryType: "transfer_out", status: "posted", pointsDelta: -100, reserveDeltaCents: 0 },
    { entryType: "issuance", status: "pending", pointsDelta: 500, reserveDeltaCents: 50 },
  ]);
  assert.deepEqual(totals, { issued: 1_000, redeemed: 250, inCirculation: 650, netFloatCents: 75 });
});

test("custom range requires ordered ISO timestamps", () => {
  assert.throws(() => parseOverviewRange({ range: "custom" }));
  assert.throws(() => parseOverviewRange({ range: "custom", from: "2026-07-10T00:00:00.000Z", to: "2026-07-01T00:00:00.000Z" }));
  const range = parseOverviewRange({ range: "7d" }, new Date("2026-07-28T00:00:00.000Z"));
  assert.equal(range.from.toISOString(), "2026-07-21T00:00:00.000Z");
});

test("merchant scope requires exactly one server-resolved active membership", () => {
  const membership = { merchantId: 4, merchantCode: "LIV001", merchantName: "Liverpool FC Retail", membershipRole: "owner" };
  assert.deepEqual(singleMerchantMembership([membership]), membership);
  assert.equal(singleMerchantMembership([]), null);
  assert.equal(singleMerchantMembership([membership, { ...membership, merchantId: 1 }]), null);
});
