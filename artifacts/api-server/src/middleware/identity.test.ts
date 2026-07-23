import assert from "node:assert/strict";
import test from "node:test";
import { authenticatedUserId } from "./identity";

test("a caller cannot replace JWT identity with a legacy user-id header", () => {
  const request = {
    auth: { userId: 17 },
    headers: { "x-rewlo-user-id": "42" },
  };
  assert.equal(authenticatedUserId(request), 17);
  assert.notEqual(authenticatedUserId(request), Number(request.headers["x-rewlo-user-id"]));
});
