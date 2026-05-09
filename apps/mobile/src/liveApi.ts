import type {
  AgentPolicy,
  ApprovalMode,
  SkillGuardNetwork,
} from "@skillguard/protocol";
import { Buffer } from "buffer";

import type { ApiActionRecord, ApiConnectionRecord, SkillGuardMobileState } from "./liveState";
import { toMobileState } from "./liveState";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;
type SignOwnerMessage = (message: Uint8Array) => Promise<Uint8Array>;

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

interface AgentsResponse {
  agents: Array<{
    agentId: string;
    description: string;
    name: string;
  }>;
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

export interface SkillGuardPolicyInput {
  allowedMints?: AgentPolicy["allowedMints"];
  allowedNetworks?: SkillGuardNetwork[];
  allowedProtocols?: string[];
  dailySpendCapAtomic?: string;
  expiresAt?: number;
  maxSpendAtomic?: string;
  mode?: ApprovalMode;
}

export interface ConnectionOwnerProof {
  type: "solana-sign-message";
  wallet: string;
  message: string;
  signatureBase64: string;
  signedAt: number;
}

export const DEFAULT_SKILLGUARD_API_URL =
  process?.env?.EXPO_PUBLIC_SKILLGUARD_API_URL ??
  "https://skillguard-sol.vercel.app/api";

export function connectionIdForWallet(
  userWallet: string,
  agentId: string
): string {
  return `conn-${agentId}-${userWallet}`;
}

export function buildDefaultPolicy(
  userWallet: string,
  agentId: string,
  input: SkillGuardPolicyInput = {}
): AgentPolicy {
  return {
    active: true,
    agentId,
    allowedMints: input.allowedMints ?? ["SOL", "USDC"],
    allowedNetworks: input.allowedNetworks ?? ["solana-devnet"],
    allowedProtocols: input.allowedProtocols ?? ["helius", "birdeye"],
    dailySpendCapAtomic: input.dailySpendCapAtomic ?? "5000000",
    expiresAt: input.expiresAt ?? 4_100_000_000,
    maxSpendAtomic: input.maxSpendAtomic ?? "1000000",
    mode: input.mode ?? "ask_every_time",
    policyId: `policy-${agentId}-${userWallet}`,
    revoked: false,
    userWallet,
  };
}

export function buildConnectionOwnerMessage({
  agentId,
  connectionId,
  policy,
  signedAt,
  userWallet,
}: {
  agentId: string;
  connectionId: string;
  policy: AgentPolicy;
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard connection approval",
    `wallet:${userWallet}`,
    `agent:${agentId}`,
    `connection:${connectionId}`,
    `policy:${policy.policyId}`,
    `mode:${policy.mode}`,
    `networks:${policy.allowedNetworks.join(",")}`,
    `protocols:${policy.allowedProtocols.join(",")}`,
    `mints:${policy.allowedMints.join(",")}`,
    `maxSpendAtomic:${policy.maxSpendAtomic}`,
    `dailySpendCapAtomic:${policy.dailySpendCapAtomic}`,
    `expiresAt:${policy.expiresAt}`,
    `signedAt:${signedAt}`,
  ].join("\n");
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
    agent: SkillGuardAgentInput,
    policyInput: SkillGuardPolicyInput | undefined,
    signOwnerMessage: SignOwnerMessage
  ): Promise<ApiConnectionRecord> {
    const connectionId = connectionIdForWallet(userWallet, agent.agentId);
    const policy = buildDefaultPolicy(userWallet, agent.agentId, policyInput);
    const ownerProof = await buildConnectionOwnerProof({
      agentId: agent.agentId,
      connectionId,
      policy,
      signOwnerMessage,
      userWallet,
    });

    await request<AgentResponse>("agents", {
      body: JSON.stringify(agent),
      headers: { "content-type": "application/json" },
      method: "POST",
    });

    const body = await request<ConnectionResponse>("connections", {
      body: JSON.stringify({
        agentId: agent.agentId,
        connectionId,
        ownerProof,
        policy,
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

    connectAgent,

    async loadWalletState(userWallet: string): Promise<SkillGuardMobileState> {
      const [connectionsBody, actionsBody, agentsBody] = await Promise.all([
        request<ConnectionsResponse>(
          `connections?wallet=${encodeURIComponent(userWallet)}`
        ),
        request<ActionsResponse>(`actions?wallet=${encodeURIComponent(userWallet)}`),
        request<AgentsResponse>("agents"),
      ]);
      return toMobileState({
        actions: actionsBody.actions,
        agents: agentsBody.agents,
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

async function buildConnectionOwnerProof({
  agentId,
  connectionId,
  policy,
  signOwnerMessage,
  userWallet,
}: {
  agentId: string;
  connectionId: string;
  policy: AgentPolicy;
  signOwnerMessage: SignOwnerMessage;
  userWallet: string;
}): Promise<ConnectionOwnerProof> {
  const signedAt = Date.now();
  const message = buildConnectionOwnerMessage({
    agentId,
    connectionId,
    policy,
    signedAt,
    userWallet,
  });
  const signature = await signOwnerMessage(new TextEncoder().encode(message));
  return {
    message,
    signatureBase64: Buffer.from(signature).toString("base64"),
    signedAt,
    type: "solana-sign-message",
    wallet: userWallet,
  };
}
