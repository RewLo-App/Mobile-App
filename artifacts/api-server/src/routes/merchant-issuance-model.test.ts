import assert from "node:assert/strict";
import test from "node:test";
import { bulkIssuanceSchema, previewBatch } from "./merchant-issuance-model";

test("bulk preview applies the campaign cap without over-issuing", () => {
  const result = previewBatch([{ userId: 1, points: 70 }, { userId: 2, points: 50 }], 100, new Set([1, 2]));
  assert.equal(result.estimatedPoints, 70);
  assert.equal(result.remainingAfter, 30);
  assert.equal(result.results[1]?.status, "skipped");
});

test("recipient input requires a batch idempotency key", () => {
  assert.equal(bulkIssuanceSchema.safeParse({ campaignId: 1, idempotencyKey: "short", recipients: [{ userId: 1, points: 10 }] }).success, false);
  assert.equal(bulkIssuanceSchema.safeParse({ campaignId: 1, idempotencyKey: "valid-idempotency-key", recipients: [{ userId: 1, points: 10 }] }).success, true);
});
