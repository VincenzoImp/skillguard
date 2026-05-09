import { describe, expect, it } from "vitest";

import { buildLoopManifest, LOOP_ACTION_SEQUENCE } from "./loopActions.js";

describe("research agent loop actions", () => {
  it("runs the wallet risk monitor sequence in demo order", () => {
    expect(LOOP_ACTION_SEQUENCE).toEqual([
      "freeScan",
      "paidReport",
      "subscriptionUpgrade",
    ]);
  });

  it("builds a free SOL-denominated wallet scan", () => {
    const manifest = buildLoopManifest("freeScan", {
      counter: 1,
      runId: "run-1",
      userWallet: "Wallet111",
    });

    expect(manifest.actionId).toBe("action-research-loop-run-1-1-freeScan");
    expect(manifest.title).toBe("Scan wallet for risky token approvals");
    expect(manifest.spend).toEqual([
      expect.objectContaining({ amountAtomic: "0", human: "0 SOL", mint: "SOL" }),
    ]);
  });

  it("can build manifests for a configured live agent id", () => {
    const manifest = buildLoopManifest("freeScan", {
      agentId: "agent-research-live",
      counter: 1,
      runId: "run-1",
      userWallet: "Wallet111",
    });

    expect(manifest.agentId).toBe("agent-research-live");
    expect(manifest.actionId).toBe("action-research-loop-run-1-1-freeScan");
  });

  it("builds a paid risk report below the demo policy cap", () => {
    const manifest = buildLoopManifest("paidReport", {
      counter: 2,
      runId: "run-1",
      userWallet: "Wallet111",
    });

    expect(manifest.actionId).toBe("action-research-loop-run-1-2-paidReport");
    expect(manifest.protocols).toEqual(["helius", "birdeye"]);
    expect(manifest.spend[0]).toEqual(
      expect.objectContaining({ amountAtomic: "1000000", human: "0.001 SOL", mint: "SOL" })
    );
  });

  it("builds an overspend subscription that policy should block", () => {
    const manifest = buildLoopManifest("subscriptionUpgrade", {
      counter: 3,
      runId: "run-1",
      userWallet: "Wallet111",
    });

    expect(manifest.kind).toBe("swap_preview");
    expect(manifest.spend[0]).toEqual(
      expect.objectContaining({ amountAtomic: "50000000", human: "0.05 SOL", mint: "SOL" })
    );
    expect(manifest.riskSignals.map((signal) => signal.code)).toContain(
      "overspend_subscription"
    );
  });
});
