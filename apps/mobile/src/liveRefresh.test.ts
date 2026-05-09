import { describe, expect, it } from "vitest";
import type { ActionManifest } from "@skillguard/protocol";

import {
  firstNewPendingAction,
  liveRefreshStatus,
  shouldOpenInboxForNewPending,
} from "./liveRefresh";
import type { SkillGuardMobileState } from "./liveState";

describe("mobile live refresh model", () => {
  it("detects the first pending action that arrived since the previous state", () => {
    const previous = state([action("pending-a", "pending")]);
    const next = state([
      action("pending-a", "pending"),
      action("pending-b", "pending"),
    ]);

    expect(firstNewPendingAction(previous, next)?.id).toBe("pending-b");
  });

  it("does not report already-visible or non-pending actions as new work", () => {
    const previous = state([action("pending-a", "pending")]);

    expect(
      firstNewPendingAction(previous, state([action("pending-a", "pending")]))
    ).toBeNull();
    expect(
      firstNewPendingAction(previous, state([action("approved-b", "approved")]))
    ).toBeNull();
  });

  it("opens Inbox for new pending work unless the user is pairing or deciding", () => {
    expect(
      shouldOpenInboxForNewPending({
        activeTab: "home",
        isBusy: false,
        isPairingScannerOpen: false,
      })
    ).toBe(true);
    expect(
      shouldOpenInboxForNewPending({
        activeTab: "pairing",
        isBusy: false,
        isPairingScannerOpen: false,
      })
    ).toBe(false);
    expect(
      shouldOpenInboxForNewPending({
        activeTab: "home",
        isBusy: true,
        isPairingScannerOpen: false,
      })
    ).toBe(false);
  });

  it("builds a concise foreground status for a new request", () => {
    expect(liveRefreshStatus(action("pending-c", "pending"))).toBe(
      "New request from agent-research: Review wallet action"
    );
  });
});

function state(actions: SkillGuardMobileState["actions"]): SkillGuardMobileState {
  return {
    actions,
    agent: null,
    agents: [],
    selectedActionId: actions[0]?.id ?? null,
  };
}

function action(id: string, status: "approved" | "blocked" | "expired" | "pending") {
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
    risk: status === "blocked" ? "danger" : "warning",
    spend: "0 USDC",
    status,
    summary: "Wallet action",
    title: "Review wallet action",
  } satisfies SkillGuardMobileState["actions"][number];
}
