import type { ActionManifest, AgentPolicy } from "./types.js";

export const fixtureWallet = "AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9";

export const safeRiskReportManifest: ActionManifest = {
  schemaVersion: "skillguard.action.v1",
  actionId: "action-safe-risk-report",
  agentId: "agent-research",
  userWallet: fixtureWallet,
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
  accountsTouched: [fixtureWallet],
  riskSignals: [
    {
      level: "low",
      code: "read_only",
      message: "No token transfer is requested.",
    },
  ],
  rawTransactionRef: null,
  createdAt: 1_800_000_000,
  expiresAt: 4_100_000_000,
};

export const unsafeOverspendManifest: ActionManifest = {
  ...safeRiskReportManifest,
  actionId: "action-unsafe-overspend",
  title: "Swap 2 USDC",
  summary: "Request exceeds the user's configured spend limit.",
  kind: "swap_preview",
  spend: [
    {
      mint: "USDC",
      amountAtomic: "2000000",
      human: "2 USDC",
      reason: "Swap preview spend",
    },
  ],
  riskSignals: [
    {
      level: "high",
      code: "overspend",
      message: "Requested spend is above the configured max spend.",
    },
  ],
};

export const expiredManifest: ActionManifest = {
  ...safeRiskReportManifest,
  actionId: "action-expired",
  expiresAt: 1_700_000_000,
};

export const askEveryTimePolicy: AgentPolicy = {
  policyId: "policy-ask-every-time",
  agentId: "agent-research",
  userWallet: fixtureWallet,
  mode: "ask_every_time",
  active: true,
  revoked: false,
  allowedNetworks: ["solana-devnet"],
  allowedProtocols: ["helius", "birdeye"],
  allowedMints: ["SOL", "USDC"],
  maxSpendAtomic: "1000000",
  dailySpendCapAtomic: "5000000",
  expiresAt: 4_100_000_000,
};

export const allowUnderLimitsPolicy: AgentPolicy = {
  ...askEveryTimePolicy,
  policyId: "policy-allow-under-limits",
  mode: "allow_under_limits",
};

export const blockPolicy: AgentPolicy = {
  ...askEveryTimePolicy,
  policyId: "policy-block",
  mode: "block",
};

export const revokedPolicy: AgentPolicy = {
  ...askEveryTimePolicy,
  policyId: "policy-revoked",
  revoked: true,
};
