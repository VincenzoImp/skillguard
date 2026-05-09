import type { ActionManifest } from "@skillguard/protocol";
import { safeRiskReportManifest } from "@skillguard/protocol";

export type ResearchActionKind = "safe" | "unsafe" | "revoked";

export function createResearchManifest(
  kind: ResearchActionKind,
  runId = String(Date.now()),
  userWallet: string,
  agentId = "agent-research"
): ActionManifest {
  const normalizedRunId = runId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const base = {
    ...safeRiskReportManifest,
    agentId,
  };

  if (kind === "unsafe") {
    return {
      ...base,
      actionId: `action-research-unsafe-${normalizedRunId}`,
      accountsTouched: [userWallet],
      kind: "swap_preview",
      protocols: ["helius"],
      riskSignals: [
        {
          code: "overspend",
          level: "high",
          message: "Requested subscription spend is above the configured max spend.",
        },
      ],
      spend: [
        {
          amountAtomic: "50000000",
          human: "0.05 SOL",
          mint: "SOL",
          reason: "Monthly risk alert subscription",
        },
      ],
      summary: "Monthly subscription to push real-time alerts via Helius webhooks.",
      title: "Subscribe to real-time risk alerts",
      userWallet,
    };
  }

  if (kind === "revoked") {
    return {
      ...base,
      actionId: `action-research-revoked-${normalizedRunId}`,
      accountsTouched: [userWallet],
      summary:
        "The agent submits this request after revocation so SkillGuard can block it.",
      title: "Request after revocation",
      userWallet,
    };
  }

  return {
    ...base,
    actionId: `action-research-safe-${normalizedRunId}`,
    accountsTouched: [userWallet],
    protocols: ["helius"],
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
    userWallet,
  };
}
