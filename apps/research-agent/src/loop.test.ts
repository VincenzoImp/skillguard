import { describe, expect, it } from "vitest";
import type { PolicyResult } from "@skillguard/protocol";

import { runLoop } from "./loop.js";

const requiresApproval: PolicyResult = {
  manifestHash: "hash",
  reasons: ["policy_requires_manual_approval"],
  riskLevel: "medium",
  status: "requires_approval",
};

const blocked: PolicyResult = {
  manifestHash: "hash-blocked",
  reasons: ["spend_exceeds_max"],
  riskLevel: "high",
  status: "fail",
};

describe("research agent loop", () => {
  it("submits free, paid, and subscription actions in order for one cycle", async () => {
    const submittedKinds: string[] = [];
    const waitedActions: string[] = [];
    const logLines: string[] = [];

    await runLoop({
      client: {
        submitAction: async (manifest) => {
          submittedKinds.push(manifest.actionId.split("-").at(-1) ?? "");
          return {
            action: { actionId: manifest.actionId, decisionStatus: null },
            result: manifest.actionId.endsWith("subscriptionUpgrade")
              ? blocked
              : requiresApproval,
          };
        },
        waitForDecision: async (actionId) => {
          waitedActions.push(actionId);
          return {
            action: { actionId, decisionStatus: "approved" },
            status: "approved",
          };
        },
      },
      cycleDelayMs: 5,
      log: (line) => logLines.push(line),
      maxCycles: 1,
      runId: "run-1",
      sleep: async () => undefined,
      userWallet: "Wallet111",
    });

    expect(submittedKinds).toEqual(["freeScan", "paidReport", "subscriptionUpgrade"]);
    expect(waitedActions).toEqual([
      "action-research-loop-run-1-1-freeScan",
      "action-research-loop-run-1-2-paidReport",
    ]);
    expect(logLines.some((line) => line.includes("subscriptionUpgrade BLOCKED"))).toBe(true);
  });

  it("exits when the wallet owner revokes the agent", async () => {
    const submitted: string[] = [];

    await runLoop({
      client: {
        submitAction: async (manifest) => {
          submitted.push(manifest.actionId);
          return {
            action: { actionId: manifest.actionId, decisionStatus: null },
            result: requiresApproval,
          };
        },
        waitForDecision: async (actionId) => ({
          action: {
            actionId,
            decisionStatus: "blocked",
            policyResult: {
              ...blocked,
              reasons: ["policy_revoked"],
            },
          },
          status: "revoked",
        }),
      },
      log: () => undefined,
      maxCycles: 3,
      runId: "run-1",
      sleep: async () => undefined,
      userWallet: "Wallet111",
    });

    expect(submitted).toEqual(["action-research-loop-run-1-1-freeScan"]);
  });
});
