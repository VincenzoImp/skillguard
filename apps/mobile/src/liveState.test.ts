import type { ActionManifest, AgentPolicy, PolicyResult } from "@skillguard/protocol";
import { describe, expect, it } from "vitest";

import {
  getBlockedActions,
  getHistoryActions,
  getPendingActions,
  getSelectedAction,
  selectAction,
  toMobileState,
} from "./liveState";

const userWallet = "Wallet111111111111111111111111111111111111";

const policy: AgentPolicy = {
  active: true,
  agentId: "agent-research",
  allowedMints: ["SOL", "USDC"],
  allowedNetworks: ["solana-devnet"],
  allowedProtocols: ["helius", "birdeye"],
  dailySpendCapAtomic: "5000000",
  expiresAt: 4_100_000_000,
  maxSpendAtomic: "1000000",
  mode: "ask_every_time",
  policyId: "policy-live",
  revoked: false,
  userWallet,
};

const manifest: ActionManifest = {
  accountsTouched: [userWallet],
  actionId: "action-live",
  agentId: "agent-research",
  createdAt: 1_800_000_000,
  expiresAt: 4_100_000_000,
  kind: "wallet_risk_report",
  network: "solana-devnet",
  protocols: ["helius"],
  rawTransactionRef: null,
  riskSignals: [
    {
      code: "read_only",
      level: "low",
      message: "No token transfer is requested.",
    },
  ],
  schemaVersion: "skillguard.action.v1",
  spend: [
    {
      amountAtomic: "0",
      human: "0 USDC",
      mint: "USDC",
      reason: "Read-only report",
    },
  ],
  summary: "Analyze wallet risk.",
  title: "Generate wallet risk report",
  userWallet,
};

describe("mobile live state mapping", () => {
  it("maps API connections and actions to a real mobile state", () => {
    const result: PolicyResult = {
      manifestHash: "hash-live",
      reasons: ["policy_requires_manual_approval"],
      riskLevel: "medium",
      status: "requires_approval",
    };

    const state = toMobileState({
      actions: [
        {
          actionId: "action-live",
          connectionId: "conn-live",
          decisionStatus: null,
          manifest,
          policyResult: result,
        },
      ],
      connections: [
        {
          agentId: "agent-research",
          connectionId: "conn-live",
          policy,
          userWallet,
        },
      ],
    });

    expect(state.agent?.status).toBe("active");
    expect(state.agent?.policy.spendLimit).toBe("0.001 SOL");
    expect(state.agents.map((agent) => agent.id)).toEqual(["agent-research"]);
    expect(state.selectedActionId).toBe("action-live");
    expect(getSelectedAction(state)?.id).toBe("action-live");
    expect(getSelectedAction(state)?.manifest).toEqual(manifest);
    expect(getPendingActions(state)).toHaveLength(1);
    expect(getBlockedActions(state)).toHaveLength(0);
    expect(state.actions[0].checks.map((check) => check.label)).toContain(
      "User approval required"
    );
  });

  it("keeps only active agents visible and chooses the first active agent as primary", () => {
    const state = toMobileState({
      actions: [],
      connections: [
        {
          agentId: "agent-revoked",
          connectionId: "conn-revoked",
          policy: {
            ...policy,
            active: false,
            agentId: "agent-revoked",
            policyId: "policy-revoked",
            revoked: true,
          },
          userWallet,
        },
        {
          agentId: "agent-payments",
          connectionId: "conn-payments",
          policy: {
            ...policy,
            agentId: "agent-payments",
            policyId: "policy-payments",
          },
          userWallet,
        },
      ],
    });

    expect(state.agents.map((agent) => [agent.id, agent.status])).toEqual([
      ["agent-payments", "active"],
    ]);
    expect(state.agent?.id).toBe("agent-payments");
  });

  it("uses registered agent metadata instead of hardcoded demo names", () => {
    const state = toMobileState({
      actions: [],
      agents: [
        {
          agentId: "agent-payments",
          description: "Payment automation approvals.",
          name: "Payments Agent",
        },
      ],
      connections: [
        {
          agentId: "agent-payments",
          connectionId: "conn-payments",
          policy: {
            ...policy,
            agentId: "agent-payments",
            policyId: "policy-payments",
          },
          userWallet,
        },
      ],
    });

    expect(state.agent?.name).toBe("Payments Agent");
    expect(state.agent?.description).toBe("Payment automation approvals.");
  });

  it("hides revoked agents and keeps blocked failed policy results in history", () => {
    const state = toMobileState({
      actions: [
        {
          actionId: "action-blocked",
          connectionId: "conn-live",
          decisionStatus: "blocked",
          manifest: {
            ...manifest,
            actionId: "action-blocked",
            spend: [
              {
                amountAtomic: "2000000",
                human: "2 USDC",
                mint: "USDC",
                reason: "Swap preview spend",
              },
            ],
          },
          policyResult: {
            manifestHash: "hash-blocked",
            reasons: ["spend_exceeds_max"],
            riskLevel: "high",
            status: "fail",
          },
        },
      ],
      connections: [
        {
          agentId: "agent-research",
          connectionId: "conn-live",
          policy: { ...policy, active: false, revoked: true },
          userWallet,
        },
      ],
    });

    expect(state.agent).toBeNull();
    expect(state.agents).toEqual([]);
    expect(getPendingActions(state)).toHaveLength(0);
    expect(getHistoryActions(state)).toHaveLength(1);
    expect(getBlockedActions(state)[0].decisionReason).toBe("Spend exceeds policy limit.");
  });

  it("treats unrecorded expired manifests as non-actionable without adding history noise", () => {
    const state = toMobileState(
      {
        actions: [
          {
            actionId: "action-expired",
            connectionId: "conn-live",
            decisionStatus: null,
            manifest: {
              ...manifest,
              actionId: "action-expired",
              expiresAt: 1_800_000_010,
            },
            policyResult: null,
          },
        ],
        connections: [
          {
            agentId: "agent-research",
            connectionId: "conn-live",
            policy,
            userWallet,
          },
        ],
      },
      { now: 1_800_000_011 }
    );

    expect(state.actions[0].status).toBe("expired");
    expect(state.actions[0].decisionReason).toBe("Agent request expired.");
    expect(getPendingActions(state)).toHaveLength(0);
    expect(getHistoryActions(state)).toEqual([]);
  });

  it("keeps API-recorded expired decisions in history", () => {
    const state = toMobileState({
      actions: [
        {
          actionId: "action-expired-recorded",
          connectionId: "conn-live",
          decisionStatus: "expired",
          manifest: {
            ...manifest,
            actionId: "action-expired-recorded",
            expiresAt: 1_800_000_010,
          },
          policyResult: null,
        },
      ],
      connections: [
        {
          agentId: "agent-research",
          connectionId: "conn-live",
          policy,
          userWallet,
        },
      ],
    });

    expect(getPendingActions(state)).toHaveLength(0);
    expect(getHistoryActions(state).map((action) => action.id)).toEqual([
      "action-expired-recorded",
    ]);
  });

  it("keeps empty live state explicit when no agent request exists yet", () => {
    const state = toMobileState({ actions: [], connections: [] });

    expect(state.agent).toBeNull();
    expect(state.selectedActionId).toBeNull();
    expect(getSelectedAction(state)).toBeNull();
  });

  it("selects only actions that exist in the live inbox", () => {
    const state = toMobileState({
      actions: [
        {
          actionId: "action-live",
          connectionId: "conn-live",
          decisionStatus: null,
          manifest,
          policyResult: null,
        },
      ],
      connections: [
        {
          agentId: "agent-research",
          connectionId: "conn-live",
          policy,
          userWallet,
        },
      ],
    });

    expect(selectAction(state, "missing").selectedActionId).toBe("action-live");
    expect(selectAction(state, "action-live").selectedActionId).toBe("action-live");
  });
});
