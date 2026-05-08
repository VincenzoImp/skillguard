import type { ActionManifest } from "@skillguard/protocol";
import {
  safeRiskReportManifest,
  unsafeOverspendManifest,
} from "@skillguard/protocol";

export type DemoActionKind = "safe" | "unsafe" | "revoked";

export function createDemoManifest(
  kind: DemoActionKind,
  runId = String(Date.now())
): ActionManifest {
  const normalizedRunId = runId.replace(/[^a-zA-Z0-9_-]/g, "-");

  if (kind === "unsafe") {
    return {
      ...unsafeOverspendManifest,
      actionId: `action-demo-unsafe-${normalizedRunId}`,
      title: "Swap 2 USDC through Jupiter",
    };
  }

  if (kind === "revoked") {
    return {
      ...safeRiskReportManifest,
      actionId: `action-demo-revoked-${normalizedRunId}`,
      summary:
        "The agent submits this request after revocation so SkillGuard can block it.",
      title: "Request after revocation",
    };
  }

  return {
    ...safeRiskReportManifest,
    actionId: `action-demo-safe-${normalizedRunId}`,
    title: "Generate wallet risk receipt",
  };
}
