import {
  askEveryTimePolicy,
  safeRiskReportManifest,
  unsafeOverspendManifest,
} from "@skillguard/protocol";

import { SkillGuardStore } from "./store.js";

export function createSeededStore(): SkillGuardStore {
  return new SkillGuardStore({
    agents: [
      {
        agentId: "agent-research",
        name: "Research Agent",
        description: "Demo Solana research agent that requests wallet-safe actions.",
      },
    ],
    connections: [
      {
        connectionId: "conn-demo",
        agentId: "agent-research",
        userWallet: safeRiskReportManifest.userWallet,
        policy: { ...askEveryTimePolicy },
      },
    ],
    actions: [
      {
        actionId: safeRiskReportManifest.actionId,
        connectionId: "conn-demo",
        manifest: safeRiskReportManifest,
        policyResult: null,
        decisionStatus: null,
      },
      {
        actionId: unsafeOverspendManifest.actionId,
        connectionId: "conn-demo",
        manifest: unsafeOverspendManifest,
        policyResult: null,
        decisionStatus: null,
      },
    ],
  });
}
