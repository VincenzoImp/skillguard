import type { ActionManifest } from "@skillguard/protocol";
import { describe, expect, it } from "vitest";

import { buildInboxPresentation } from "./inboxPresentation";
import type { SkillGuardMobileState } from "./liveState";

describe("inbox presentation", () => {
  it("shows a pending request once by excluding the selected detail from the queue list", () => {
    const presentation = buildInboxPresentation(
      [
        action("pending-a", "pending"),
        action("pending-b", "pending"),
        action("approved-a", "approved"),
      ],
      "pending-a"
    );

    expect(presentation.selectedAction?.id).toBe("pending-a");
    expect(presentation.queueActions.map((item) => item.id)).toEqual(["pending-b"]);
    expect(presentation.pendingCount).toBe(2);
  });

  it("does not put approved or expired requests back into the live inbox", () => {
    const presentation = buildInboxPresentation(
      [action("approved-a", "approved"), action("expired-a", "expired")],
      "approved-a"
    );

    expect(presentation.selectedAction).toBeNull();
    expect(presentation.queueActions).toEqual([]);
    expect(presentation.pendingCount).toBe(0);
  });
});

function action(
  id: string,
  status: "approved" | "expired" | "pending"
): SkillGuardMobileState["actions"][number] {
  const manifest: ActionManifest = {
    accountsTouched: ["Wallet111"],
    actionId: id,
    agentId: "agent-research",
    createdAt: 1_800_000_000,
    expiresAt: 4_100_000_000,
    kind: "wallet_risk_report",
    network: "solana-devnet",
    protocols: ["helius"],
    rawTransactionRef: null,
    riskSignals: [],
    schemaVersion: "skillguard.action.v1",
    spend: [{ amountAtomic: "0", human: "0 SOL", mint: "SOL", reason: "Read-only" }],
    summary: "Wallet action",
    title: "Review wallet action",
    userWallet: "Wallet111",
  };

  return {
    agentId: "agent-research",
    checks: [],
    connectionId: "conn-agent",
    id,
    manifest,
    manifestHash: `hash-${id}`,
    network: "Solana devnet",
    policyResultSummary: "requires_approval:medium:manual",
    requestedAt: "now",
    risk: "warning",
    spend: "0 USDC",
    status,
    summary: "Wallet action",
    title: "Review wallet action",
  };
}
