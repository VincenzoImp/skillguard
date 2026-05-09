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
        { label: "Per-action cap", value: agent.policy.spendLimit },
        { label: "Daily cap", value: `${formatLamports(agent.rawPolicy.dailySpendCapAtomic)} SOL` },
        { label: "Network", value: agent.policy.network },
        {
          label: "Protocols",
          value: agent.policy.allowedProtocols.join(", ") || "None",
        },
        {
          label: "Allowed mints",
          value: agent.rawPolicy.allowedMints.join(", ") || "None",
        },
      ],
    }));
}

function formatLamports(value: string): string {
  const lamports = BigInt(value);
  const whole = lamports / 1_000_000_000n;
  const fraction = lamports % 1_000_000_000n;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(9, "0").replace(/0+$/, "")}`;
}
