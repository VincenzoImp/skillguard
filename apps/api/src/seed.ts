import {
  askEveryTimePolicy,
  safeRiskReportManifest,
  unsafeOverspendManifest,
} from "@skillguard/protocol";

import { SkillGuardStore } from "./store.js";
import type { StoreSnapshot } from "./store.js";

export function createEmptySnapshot(): StoreSnapshot {
  return {
    actions: [],
    agents: [],
    connections: [],
  };
}

export function createEmptyStore(): SkillGuardStore {
  return new SkillGuardStore(createEmptySnapshot());
}

export function createSeededSnapshot(): StoreSnapshot {
  return {
    agents: [
      {
        agentId: "agent-research",
        name: "Research Agent",
        description: "Solana research agent that requests wallet-safe actions.",
      },
    ],
    connections: [
      {
        connectionId: "conn-seeded",
        agentId: "agent-research",
        userWallet: safeRiskReportManifest.userWallet,
        policy: { ...askEveryTimePolicy },
      },
    ],
    actions: [
      {
        actionId: safeRiskReportManifest.actionId,
        connectionId: "conn-seeded",
        manifest: safeRiskReportManifest,
        policyResult: null,
        decisionStatus: null,
      },
      {
        actionId: unsafeOverspendManifest.actionId,
        connectionId: "conn-seeded",
        manifest: unsafeOverspendManifest,
        policyResult: null,
        decisionStatus: null,
      },
    ],
  };
}

export function createSeededStore(): SkillGuardStore {
  return new SkillGuardStore(createSeededSnapshot());
}
