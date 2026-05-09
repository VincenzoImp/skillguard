import type { ActionManifest, AgentPolicy, PolicyResult } from "@skillguard/protocol";

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

interface SkillGuardClientOptions {
  apiUrl: string;
  connectionId: string;
  fetch?: FetchLike;
}

interface ActionResponse {
  action: {
    actionId: string;
    decisionStatus: string | null;
  };
}

interface EvaluationResponse {
  result: PolicyResult;
}

interface ConnectionResponse {
  connection: {
    connectionId: string;
  };
}

interface AgentResponse {
  agent: {
    agentId: string;
  };
}

export interface SubmittedAction {
  action: ActionResponse["action"];
  result: PolicyResult;
}

export function createSkillGuardClient({
  apiUrl,
  connectionId,
  fetch: fetchImpl = globalThis.fetch,
}: SkillGuardClientOptions) {
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(new URL(path, baseUrl), init);
    if (!response.ok) {
      throw new Error(`SkillGuard API ${response.status} for ${path}`);
    }
    return (await response.json()) as T;
  }

  return {
    async ensureAgentConnection(userWallet: string): Promise<ConnectionResponse["connection"]> {
      await request<AgentResponse>("agents", {
        body: JSON.stringify(DEMO_AGENT),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      const body = await request<ConnectionResponse>("connections", {
        body: JSON.stringify({
          agentId: DEMO_AGENT.agentId,
          connectionId,
          policy: policyForWallet(userWallet),
          userWallet,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      return body.connection;
    },

    async revokeConnection(): Promise<ConnectionResponse["connection"]> {
      const body = await request<ConnectionResponse>(
        `connections/${connectionId}/revoke`,
        { method: "POST" }
      );
      return body.connection;
    },

    async submitAction(manifest: ActionManifest): Promise<SubmittedAction> {
      const actionBody = await request<ActionResponse>("actions", {
        body: JSON.stringify({ connectionId, manifest }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const evaluationBody = await request<EvaluationResponse>(
        `actions/${manifest.actionId}/evaluate`,
        { method: "POST" }
      );

      return {
        action: actionBody.action,
        result: evaluationBody.result,
      };
    },
  };
}

export const DEMO_AGENT = {
  agentId: "agent-research",
  description: "Demo Solana research agent that requests wallet-safe actions.",
  name: "Research Agent",
};

export function connectionIdForWallet(userWallet: string, agentId = DEMO_AGENT.agentId): string {
  return `conn-${agentId}-${userWallet}`;
}

function policyForWallet(userWallet: string): AgentPolicy {
  return {
    active: true,
    agentId: DEMO_AGENT.agentId,
    allowedMints: ["SOL", "USDC"],
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: ["helius", "birdeye"],
    dailySpendCapAtomic: "5000000",
    expiresAt: 4_100_000_000,
    maxSpendAtomic: "1000000",
    mode: "ask_every_time",
    policyId: `policy-${DEMO_AGENT.agentId}-${userWallet}`,
    revoked: false,
    userWallet,
  };
}
