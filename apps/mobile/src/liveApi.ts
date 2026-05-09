import type { AgentPolicy, ApprovalMode } from "@skillguard/protocol";

import type { ApiActionRecord, ApiConnectionRecord, SkillGuardMobileState } from "./liveState";
import { toMobileState } from "./liveState";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

interface AgentResponse {
  agent: {
    agentId: string;
  };
}

interface ConnectionResponse {
  connection: ApiConnectionRecord;
}

interface ConnectionsResponse {
  connections: ApiConnectionRecord[];
}

interface ActionResponse {
  action: ApiActionRecord;
}

interface ActionsResponse {
  actions: ApiActionRecord[];
}

export interface SkillGuardAgentInput {
  agentId: string;
  description: string;
  name: string;
}

export const SKILLGUARD_AGENT = {
  agentId: "agent-research",
  description: "Solana research agent that requests wallet-safe actions.",
  name: "Research Agent",
} satisfies SkillGuardAgentInput;

export const DEFAULT_SKILLGUARD_API_URL =
  process?.env?.EXPO_PUBLIC_SKILLGUARD_API_URL ??
  "https://skillguard-sol.vercel.app/api";

export function connectionIdForWallet(
  userWallet: string,
  agentId = SKILLGUARD_AGENT.agentId
): string {
  return `conn-${agentId}-${userWallet}`;
}

export function buildDefaultPolicy(
  userWallet: string,
  agentId = SKILLGUARD_AGENT.agentId
): AgentPolicy {
  return {
    active: true,
    agentId,
    allowedMints: ["SOL", "USDC"],
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: ["helius", "birdeye"],
    dailySpendCapAtomic: "5000000",
    expiresAt: 4_100_000_000,
    maxSpendAtomic: "1000000",
    mode: "ask_every_time",
    policyId: `policy-${agentId}-${userWallet}`,
    revoked: false,
    userWallet,
  };
}

export function createSkillGuardApiClient(
  apiUrl = DEFAULT_SKILLGUARD_API_URL,
  fetchImpl: FetchLike = globalThis.fetch
) {
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(new URL(path, baseUrl).toString(), init);
    if (!response.ok) {
      throw new Error(`SkillGuard API ${response.status} for ${path}`);
    }
    return (await response.json()) as T;
  }

  async function connectAgent(
    userWallet: string,
    agent: SkillGuardAgentInput
  ): Promise<ApiConnectionRecord> {
    await request<AgentResponse>("agents", {
      body: JSON.stringify(agent),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const body = await request<ConnectionResponse>("connections", {
      body: JSON.stringify({
        agentId: agent.agentId,
        connectionId: connectionIdForWallet(userWallet, agent.agentId),
        policy: buildDefaultPolicy(userWallet, agent.agentId),
        userWallet,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
    return body.connection;
  }

  return {
    async approveAction(
      actionId: string,
      signature: string,
      receiptAddress: string
    ): Promise<ApiActionRecord> {
      const body = await request<ActionResponse>(
        `actions/${encodeURIComponent(actionId)}/decision`,
        {
          body: JSON.stringify({
            receiptAddress,
            signature,
            status: "approved",
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }
      );
      return body.action;
    },

    async ensureAgentConnection(userWallet: string): Promise<ApiConnectionRecord> {
      return connectAgent(userWallet, SKILLGUARD_AGENT);
    },

    connectAgent,

    async loadWalletState(userWallet: string): Promise<SkillGuardMobileState> {
      const [connectionsBody, actionsBody] = await Promise.all([
        request<ConnectionsResponse>(
          `connections?wallet=${encodeURIComponent(userWallet)}`
        ),
        request<ActionsResponse>(`actions?wallet=${encodeURIComponent(userWallet)}`),
      ]);
      return toMobileState({
        actions: actionsBody.actions,
        connections: connectionsBody.connections,
      });
    },

    async rejectAction(actionId: string): Promise<ApiActionRecord> {
      const body = await request<ActionResponse>(
        `actions/${encodeURIComponent(actionId)}/decision`,
        {
          body: JSON.stringify({ status: "rejected" }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }
      );
      return body.action;
    },

    async revokeConnection(connectionId: string): Promise<ApiConnectionRecord> {
      const body = await request<ConnectionResponse>(
        `connections/${encodeURIComponent(connectionId)}`,
        { method: "DELETE" }
      );
      return body.connection;
    },

    async updatePolicyMode(
      connectionId: string,
      _currentPolicy: AgentPolicy,
      mode: ApprovalMode
    ): Promise<ApiConnectionRecord> {
      const body = await request<ConnectionResponse>(
        `connections/${encodeURIComponent(connectionId)}/policy`,
        {
          body: JSON.stringify({ mode }),
          headers: { "content-type": "application/json" },
          method: "PATCH",
        }
      );
      return body.connection;
    },
  };
}
