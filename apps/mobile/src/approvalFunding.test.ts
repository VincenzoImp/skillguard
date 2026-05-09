import { describe, expect, it } from "vitest";
import type { ActionManifest } from "@skillguard/protocol";

import {
  approvalFundingIssue,
  formatLamportsAsSol,
  requiredApprovalLamports,
  totalSolSpendLamports,
} from "./approvalFunding";

const manifest: ActionManifest = {
  schemaVersion: "skillguard.action.v1",
  actionId: "act-paid",
  agentId: "agent-research",
  userWallet: "13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q",
  network: "solana-devnet",
  kind: "wallet_risk_report",
  title: "Paid report",
  summary: "Generate a paid wallet report.",
  protocols: ["helius", "birdeye"],
  spend: [
    {
      amountAtomic: "1000000",
      human: "0.001 SOL",
      mint: "SOL",
      reason: "Research API quota",
    },
  ],
  accountsTouched: ["13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q"],
  riskSignals: [],
  rawTransactionRef: null,
  createdAt: 0,
  expiresAt: 4_100_000_000,
};

describe("approval funding checks", () => {
  it("sums SOL spend in lamports", () => {
    expect(totalSolSpendLamports(manifest)).toBe(1_000_000);
  });

  it("includes transfer spend, rent, and fee in the approval requirement", () => {
    expect(
      requiredApprovalLamports({
        feeLamports: 5_000,
        manifest,
        rentLamports: 2_136_720,
      })
    ).toEqual({
      feeLamports: 5_000,
      rentLamports: 2_136_720,
      spendLamports: 1_000_000,
      totalLamports: 3_141_720,
    });
  });

  it("formats lamports with enough precision for tiny devnet balances", () => {
    expect(formatLamportsAsSol(3_141_720)).toBe("0.00314172 SOL");
    expect(formatLamportsAsSol(0)).toBe("0 SOL");
  });

  it("returns a clear devnet funding issue before wallet signature", () => {
    expect(
      approvalFundingIssue({
        availableLamports: 2_532_000,
        required: {
          feeLamports: 5_000,
          rentLamports: 2_136_720,
          spendLamports: 1_000_000,
          totalLamports: 3_141_720,
        },
      })
    ).toBe(
      "Insufficient devnet SOL: need 0.00314172 SOL, wallet has 0.002532 SOL. Airdrop devnet SOL and retry."
    );
  });

  it("allows approval when the wallet can cover spend, rent, and fee", () => {
    expect(
      approvalFundingIssue({
        availableLamports: 4_000_000,
        required: {
          feeLamports: 5_000,
          rentLamports: 2_136_720,
          spendLamports: 1_000_000,
          totalLamports: 3_141_720,
        },
      })
    ).toBeNull();
  });
});
