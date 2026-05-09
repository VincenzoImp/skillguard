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

export const SKILLGUARD_AGENT = {
  agentId: "agent-research",
  description: "Solana research agent that requests wallet-safe actions.",
  name: "Research Agent",
};

export const DEFAULT_SKILLGUARD_API_URL =
  process?.env?.EXPO_PUBLIC_SKILLGUARD_API_URL ?? "http://10.0.2.2:8787";

export function connectionIdForWallet(
  userWallet: string,
  agentId = SKILLGUARD_AGENT.agentId
): string {
  return `conn-${agentId}-${userWallet}`;
}

export function buildDefaultPolicy(userWallet: string): AgentPolicy {
  return {
    active: true,
    agentId: SKILLGUARD_AGENT.agentId,
    allowedMints: ["SOL", "USDC"],
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: ["helius", "birdeye"],
    dailySpendCapAtomic: "5000000",
    expiresAt: 4_100_000_000,
    maxSpendAtomic: "1000000",
    mode: "ask_every_time",
    policyId: `policy-${SKILLGUARD_AGENT.agentId}-${userWallet}`,
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
      await request<AgentResponse>("agents", {
        body: JSON.stringify(SKILLGUARD_AGENT),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      const body = await request<ConnectionResponse>("connections", {
        body: JSON.stringify({
          agentId: SKILLGUARD_AGENT.agentId,
          connectionId: connectionIdForWallet(userWallet),
          policy: buildDefaultPolicy(userWallet),
          userWallet,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      return body.connection;
    },

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
