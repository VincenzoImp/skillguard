import { describe, expect, it } from "vitest";
import type { ActionManifest } from "@skillguard/protocol";

import {
  buildDashboardSummary,
  buildTabItems,
  recommendedInitialTab,
} from "./appNavigation";
import type { SkillGuardMobileState } from "./liveState";

const baseState: SkillGuardMobileState = {
  actions: [],
  agent: null,
  agents: [],
  selectedActionId: null,
};

describe("mobile app navigation model", () => {
  it("keeps the app split into the five product pages users need", () => {
    expect(buildTabItems(baseState, false).map((tab) => tab.id)).toEqual([
      "home",
      "inbox",
      "agents",
      "pairing",
      "activity",
    ]);
  });

  it("surfaces inbox and agent counts in the tab bar", () => {
    const tabs = buildTabItems(
      {
        ...baseState,
        actions: [
          action("pending-a", "pending"),
          action("approved-a", "approved"),
        ],
        agents: [
          {
            connectionId: "conn-agent",
            description: "Research",
            id: "agent-research",
            lastSeen: "live API",
            name: "Research Agent",
            policy: {
              allowedProtocols: ["helius"],
              mode: "ask_every_time",
              network: "Solana devnet",
              permissions: ["Request approvals"],
              spendLimit: "1 USDC",
            },
            rawPolicy: {
              active: true,
              agentId: "agent-research",
              allowedMints: ["USDC"],
              allowedNetworks: ["solana-devnet"],
              allowedProtocols: ["helius"],
              dailySpendCapAtomic: "5000000",
              expiresAt: 4_100_000_000,
              maxSpendAtomic: "1000000",
              mode: "ask_every_time",
              policyId: "policy-agent",
              revoked: false,
              userWallet: "Wallet111",
            },
            status: "active",
          },
        ],
      },
      true
    );

    expect(tabs.find((tab) => tab.id === "inbox")?.badge).toBe("1");
    expect(tabs.find((tab) => tab.id === "agents")?.badge).toBe("1");
    expect(tabs.find((tab) => tab.id === "home")?.isPrimary).toBe(true);
  });

  it("recommends the right first page for the current wallet state", () => {
    expect(recommendedInitialTab(baseState, false)).toBe("home");
    expect(recommendedInitialTab(baseState, true)).toBe("pairing");
    expect(
      recommendedInitialTab(
        {
          ...baseState,
          actions: [action("pending-a", "pending")],
        },
        true
      )
    ).toBe("inbox");
  });

  it("builds a compact dashboard summary without seeded demo assumptions", () => {
    expect(
      buildDashboardSummary({
        ...baseState,
        actions: [
          action("pending-a", "pending"),
          action("blocked-a", "blocked"),
          action("approved-a", "approved"),
        ],
        agents: [
          {
            connectionId: "conn-agent",
            description: "Research",
            id: "agent-research",
            lastSeen: "live API",
            name: "Research Agent",
            policy: {
              allowedProtocols: ["helius"],
              mode: "ask_every_time",
              network: "Solana devnet",
              permissions: ["Request approvals"],
              spendLimit: "1 USDC",
            },
            rawPolicy: {
              active: true,
              agentId: "agent-research",
              allowedMints: ["USDC"],
              allowedNetworks: ["solana-devnet"],
              allowedProtocols: ["helius"],
              dailySpendCapAtomic: "5000000",
              expiresAt: 4_100_000_000,
              maxSpendAtomic: "1000000",
              mode: "ask_every_time",
              policyId: "policy-agent",
              revoked: false,
              userWallet: "Wallet111",
            },
            status: "active",
          },
        ],
      })
    ).toEqual({
      activeAgents: 1,
      blockedActions: 1,
      pendingActions: 1,
      totalActions: 3,
    });
  });
});

function action(id: string, status: "approved" | "blocked" | "pending") {
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
