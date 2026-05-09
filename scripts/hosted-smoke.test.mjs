import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  assertPolicyResult,
  defaultSmokeIdentity,
  normalizeApiUrl,
} from "./hosted-smoke.mjs";

describe("hosted smoke helpers", () => {
  it("normalizes the hosted API URL without changing the path", () => {
    assert.equal(
      normalizeApiUrl("https://skillguard-sol.vercel.app/api/"),
      "https://skillguard-sol.vercel.app/api",
    );
  });

  it("creates a deterministic smoke wallet and run id from the same seed", () => {
    const identity = defaultSmokeIdentity(1_800_000_000_000, 42);

    assert.deepEqual(identity, {
      runId: "smoke-1800000000000-42",
      wallet: "SmokeWallet180000000000042",
    });
  });

  it("accepts the expected policy status and reason", () => {
    assert.doesNotThrow(() => {
      assertPolicyResult("safe", {
        actionId: "action-research-safe-smoke",
        policyReasons: ["policy_requires_manual_approval"],
        policyStatus: "requires_approval",
      }, "requires_approval", "policy_requires_manual_approval");
    });
  });

  it("rejects unexpected policy results", () => {
    assert.throws(
      () => {
        assertPolicyResult("unsafe", {
          actionId: "action-research-unsafe-smoke",
          policyReasons: ["policy_requires_manual_approval"],
          policyStatus: "requires_approval",
        }, "fail", "spend_exceeds_max");
      },
      /unsafe expected fail/,
    );
  });
});
