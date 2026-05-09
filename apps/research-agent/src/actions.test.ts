import { describe, expect, it } from "vitest";
import { createResearchManifest } from "./actions.js";

describe("research agent actions", () => {
  it("creates a deterministic safe action manifest", () => {
    const manifest = createResearchManifest("safe", "run-1", "Wallet111");

    expect(manifest.actionId).toBe("action-research-safe-run-1");
    expect(manifest.title).toContain("wallet risk");
    expect(manifest.userWallet).toBe("Wallet111");
    expect(manifest.accountsTouched).toEqual(["Wallet111"]);
    expect(manifest.spend).toEqual([
      expect.objectContaining({ amountAtomic: "0", mint: "USDC" }),
    ]);
  });

  it("creates an unsafe overspend action manifest", () => {
    const manifest = createResearchManifest("unsafe", "run-2", "Wallet222");

    expect(manifest.actionId).toBe("action-research-unsafe-run-2");
    expect(manifest.userWallet).toBe("Wallet222");
    expect(manifest.riskSignals.map((signal) => signal.code)).toContain("overspend");
    expect(manifest.spend[0]?.amountAtomic).toBe("2000000");
  });

  it("creates a revoked-path action manifest", () => {
    const manifest = createResearchManifest("revoked", "run-3", "Wallet333");

    expect(manifest.actionId).toBe("action-research-revoked-run-3");
    expect(manifest.userWallet).toBe("Wallet333");
    expect(manifest.summary).toContain("after revocation");
    expect(manifest.rawTransactionRef).toBeNull();
  });
});
