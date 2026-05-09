import { describe, expect, it } from "vitest";
import { createDemoManifest } from "./actions.js";

describe("demo agent actions", () => {
  it("creates a deterministic safe action manifest", () => {
    const manifest = createDemoManifest("safe", "run-1", "Wallet111");

    expect(manifest.actionId).toBe("action-demo-safe-run-1");
    expect(manifest.title).toContain("wallet risk");
    expect(manifest.userWallet).toBe("Wallet111");
    expect(manifest.accountsTouched).toEqual(["Wallet111"]);
    expect(manifest.spend).toEqual([
      expect.objectContaining({ amountAtomic: "0", mint: "USDC" }),
    ]);
  });

  it("creates an unsafe overspend action manifest", () => {
    const manifest = createDemoManifest("unsafe", "run-2", "Wallet222");

    expect(manifest.actionId).toBe("action-demo-unsafe-run-2");
    expect(manifest.userWallet).toBe("Wallet222");
    expect(manifest.riskSignals.map((signal) => signal.code)).toContain("overspend");
    expect(manifest.spend[0]?.amountAtomic).toBe("2000000");
  });

  it("creates a revoked-path action manifest", () => {
    const manifest = createDemoManifest("revoked", "run-3", "Wallet333");

    expect(manifest.actionId).toBe("action-demo-revoked-run-3");
    expect(manifest.userWallet).toBe("Wallet333");
    expect(manifest.summary).toContain("after revocation");
    expect(manifest.rawTransactionRef).toBeNull();
  });
});
