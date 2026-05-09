import type { ActionManifest } from "@skillguard/protocol";

export type LoopActionKind = "freeScan" | "paidReport" | "subscriptionUpgrade";

export const LOOP_ACTION_SEQUENCE: readonly LoopActionKind[] = [
  "freeScan",
  "paidReport",
  "subscriptionUpgrade",
];

export interface BuildLoopManifestInput {
  agentId?: string;
  counter: number;
  runId: string;
  userWallet: string;
}

export function buildLoopManifest(
  kind: LoopActionKind,
  { agentId = "agent-research", counter, runId, userWallet }: BuildLoopManifestInput
): ActionManifest {
  const normalizedRunId = runId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const actionId = `action-research-loop-${normalizedRunId}-${counter}-${kind}`;
  const createdAt = Math.floor(Date.now() / 1000);
  const base = {
    accountsTouched: [userWallet],
    actionId,
    agentId,
    createdAt,
    expiresAt: createdAt + 15 * 60,
    network: "solana-devnet" as const,
    rawTransactionRef: null,
    schemaVersion: "skillguard.action.v1" as const,
    userWallet,
  };

  if (kind === "paidReport") {
    return {
      ...base,
      kind: "wallet_risk_report",
      protocols: ["helius", "birdeye"],
      riskSignals: [
        {
          code: "metered_read",
          level: "low",
          message: "Spend is below the configured per-action cap.",
        },
      ],
      spend: [
        {
          amountAtomic: "1000000",
          human: "0.001 SOL",
          mint: "SOL",
          reason: "API quota for the signed PDF risk report",
        },
      ],
      summary:
        "Pull transaction history via Helius and price moves via Birdeye, then output a signed wallet risk report.",
      title: "Generate weekly wallet risk PDF",
    };
  }

  if (kind === "subscriptionUpgrade") {
    return {
      ...base,
      kind: "swap_preview",
      protocols: ["helius"],
      riskSignals: [
        {
          code: "overspend_subscription",
          level: "high",
          message: "Subscription spend is above the configured per-action cap.",
        },
      ],
      spend: [
        {
          amountAtomic: "50000000",
          human: "0.05 SOL",
          mint: "SOL",
          reason: "Monthly real-time risk alert subscription",
        },
      ],
      summary: "Monthly subscription to push real-time alerts via Helius webhooks.",
      title: "Subscribe to real-time risk alerts",
    };
  }

  return {
    ...base,
    kind: "wallet_risk_report",
    protocols: ["helius"],
    riskSignals: [
      {
        code: "read_only",
        level: "low",
        message: "No funds move.",
      },
    ],
    spend: [
      {
        amountAtomic: "0",
        human: "0 SOL",
        mint: "SOL",
        reason: "Read-only scan",
      },
    ],
    summary: "Read-only check via Helius for suspicious SPL token approvals and dust attacks.",
    title: "Scan wallet for risky token approvals",
  };
}
