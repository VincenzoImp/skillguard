import type { ActionManifest } from "@skillguard/protocol";
import {
  safeRiskReportManifest,
  unsafeOverspendManifest,
} from "@skillguard/protocol";

export type DemoActionKind = "safe" | "unsafe" | "revoked";

export function createDemoManifest(
  kind: DemoActionKind,
  runId = String(Date.now()),
  userWallet: string
): ActionManifest {
  const normalizedRunId = runId.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (kind === "unsafe") {
    return {
      ...unsafeOverspendManifest,
      actionId: `action-demo-unsafe-${normalizedRunId}`,
      accountsTouched: [userWallet],
      title: "Swap 2 USDC through Jupiter",
      userWallet,
    };
  }

  if (kind === "revoked") {
    return {
      ...safeRiskReportManifest,
      actionId: `action-demo-revoked-${normalizedRunId}`,
      accountsTouched: [userWallet],
      summary:
        "The agent submits this request after revocation so SkillGuard can block it.",
      title: "Request after revocation",
      userWallet,
    };
  }

  return {
    ...safeRiskReportManifest,
    actionId: `action-demo-safe-${normalizedRunId}`,
    accountsTouched: [userWallet],
    title: "Generate wallet risk receipt",
    userWallet,
  };
}
