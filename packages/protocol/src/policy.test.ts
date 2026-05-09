import { describe, expect, test } from "vitest";

import {
  allowUnderLimitsPolicy,
  askEveryTimePolicy,
  blockPolicy,
  expiredManifest,
  revokedPolicy,
  safeRiskReportManifest,
  unsafeOverspendManifest,
} from "./fixtures.js";
import { canonicalJson, hashActionManifest } from "./hash.js";
import { evaluatePolicy } from "./policy.js";
import type { ActionManifest } from "./types.js";

const baseManifest: ActionManifest = {
  schemaVersion: "skillguard.action.v1",
  actionId: "action-safe-risk-report",
  agentId: "agent-research",
  userWallet: "FixtureWallet111111111111111111111111111111",
  network: "solana-devnet",
  kind: "wallet_risk_report",
  title: "Generate wallet risk report",
  summary: "Analyze token balances and recent interactions without spending funds.",
  protocols: ["helius", "birdeye"],
  spend: [
    {
      mint: "USDC",
      amountAtomic: "0",
      human: "0 USDC",
      reason: "Read-only report",
    },
  ],
  accountsTouched: ["FixtureWallet111111111111111111111111111111"],
  riskSignals: [
    {
      level: "low",
      code: "read_only",
      message: "No token transfer is requested.",
    },
  ],
  rawTransactionRef: null,
  createdAt: 1_800_000_000,
  expiresAt: 1_800_003_600,
};

describe("canonical hashing", () => {
  test("serializes objects with recursively sorted keys", () => {
    expect(canonicalJson({ z: 1, nested: { b: true, a: false }, a: 2 })).toBe(
      '{"a":2,"nested":{"a":false,"b":true},"z":1}',
    );
  });

  test("returns the same manifest hash when object keys are reordered", () => {
    const reorderedManifest = {
      expiresAt: baseManifest.expiresAt,
      createdAt: baseManifest.createdAt,
      rawTransactionRef: baseManifest.rawTransactionRef,
      riskSignals: baseManifest.riskSignals,
      accountsTouched: baseManifest.accountsTouched,
      spend: baseManifest.spend,
      protocols: baseManifest.protocols,
      summary: baseManifest.summary,
      title: baseManifest.title,
      kind: baseManifest.kind,
      network: baseManifest.network,
      userWallet: baseManifest.userWallet,
      agentId: baseManifest.agentId,
      actionId: baseManifest.actionId,
      schemaVersion: baseManifest.schemaVersion,
    } satisfies ActionManifest;

    expect(hashActionManifest(reorderedManifest)).toBe(hashActionManifest(baseManifest));
  });

  test("returns a different manifest hash when spend amount changes", () => {
    const changedManifest: ActionManifest = {
      ...baseManifest,
      spend: [{ ...baseManifest.spend[0], amountAtomic: "1000000", human: "1 USDC" }],
    };

    expect(hashActionManifest(changedManifest)).not.toBe(hashActionManifest(baseManifest));
  });
});

describe("policy engine", () => {
  test("requires approval for a safe manifest when policy mode asks every time", () => {
    const result = evaluatePolicy(safeRiskReportManifest, askEveryTimePolicy);

    expect(result.status).toBe("requires_approval");
    expect(result.reasons).toContain("policy_requires_manual_approval");
    expect(result.manifestHash).toBe(hashActionManifest(safeRiskReportManifest));
  });

  test("passes a safe manifest when policy allows actions under limits", () => {
    const result = evaluatePolicy(safeRiskReportManifest, allowUnderLimitsPolicy);

    expect(result.status).toBe("pass");
    expect(result.reasons).toEqual([]);
    expect(result.riskLevel).toBe("low");
  });

  test("fails when manifest spend exceeds the policy max spend", () => {
    const result = evaluatePolicy(unsafeOverspendManifest, allowUnderLimitsPolicy);

    expect(result.status).toBe("fail");
    expect(result.reasons).toContain("spend_exceeds_max");
    expect(result.riskLevel).toBe("high");
  });

  test("fails when the manifest is expired", () => {
    const result = evaluatePolicy(expiredManifest, allowUnderLimitsPolicy);

    expect(result.status).toBe("fail");
    expect(result.reasons).toContain("manifest_expired");
  });

  test("fails when the policy is revoked", () => {
    const result = evaluatePolicy(safeRiskReportManifest, revokedPolicy);

    expect(result.status).toBe("fail");
    expect(result.reasons).toContain("policy_revoked");
  });

  test("fails when a manifest uses an unsupported protocol", () => {
    const unsupportedProtocolManifest: ActionManifest = {
      ...safeRiskReportManifest,
      protocols: ["unknown-protocol"],
    };

    const result = evaluatePolicy(unsupportedProtocolManifest, allowUnderLimitsPolicy);

    expect(result.status).toBe("fail");
    expect(result.reasons).toContain("protocol_not_allowed:unknown-protocol");
  });

  test("fails when policy mode is block", () => {
    const result = evaluatePolicy(safeRiskReportManifest, blockPolicy);

    expect(result.status).toBe("fail");
    expect(result.reasons).toContain("policy_mode_block");
  });

  test("requires approval when an allowed manifest includes an unknown raw transaction reference", () => {
    const rawTransactionManifest: ActionManifest = {
      ...safeRiskReportManifest,
      rawTransactionRef: "ipfs://raw-transaction-preview",
    };

    const result = evaluatePolicy(rawTransactionManifest, allowUnderLimitsPolicy);

    expect(result.status).toBe("requires_approval");
    expect(result.reasons).toContain("raw_transaction_requires_approval");
  });
});
