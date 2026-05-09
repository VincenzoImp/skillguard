import type { ConnectedAgent, PolicyMode } from "./liveState";

export interface PermissionRule {
  label: string;
  value: string;
}

export interface PermissionCard {
  agentName: string;
  connectionId: string;
  description: string;
  mode: PolicyMode;
  rules: PermissionRule[];
}

export function buildPermissionCards(agents: ConnectedAgent[]): PermissionCard[] {
  return agents
    .filter((agent) => agent.status === "active")
    .map((agent) => ({
      agentName: agent.name,
      connectionId: agent.connectionId,
      description: agent.description,
      mode: agent.policy.mode,
      rules: [
        { label: "Spend limit", value: agent.policy.spendLimit },
        { label: "Network", value: agent.policy.network },
        {
          label: "Protocols",
          value: agent.policy.allowedProtocols.join(", ") || "None",
        },
        {
          label: "Allowed actions",
          value: agent.policy.permissions.join(", ") || "None",
        },
      ],
    }));
}
