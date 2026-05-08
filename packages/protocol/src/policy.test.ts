import { describe, expect, test } from "vitest";

import { canonicalJson, hashActionManifest } from "./hash.js";
import type { ActionManifest } from "./types.js";

const baseManifest: ActionManifest = {
  schemaVersion: "skillguard.action.v1",
  actionId: "action-safe-risk-report",
  agentId: "agent-research",
  userWallet: "DemoWallet111111111111111111111111111111111",
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
  accountsTouched: ["DemoWallet111111111111111111111111111111111"],
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
