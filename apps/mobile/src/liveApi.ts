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
    publicKey?: string;
  }>;
}

interface WalletSessionResponse {
  session: {
    expiresAt: number;
    token: string;
  };
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
  publicKey?: string;
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

export function buildPolicyUpdateOwnerMessage({
  connectionId,
  policyPatch,
  signedAt,
  userWallet,
}: {
  connectionId: string;
  policyPatch: Partial<AgentPolicy>;
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard policy update",
    `wallet:${userWallet}`,
    `connection:${connectionId}`,
    `policyPatch:${canonicalJson(policyPatch)}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildConnectionRevokeOwnerMessage({
  connectionId,
  signedAt,
  userWallet,
}: {
  connectionId: string;
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard connection revoke",
    `wallet:${userWallet}`,
    `connection:${connectionId}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildActionDecisionOwnerMessage({
  actionId,
  connectionId,
  receiptAddress,
  signature,
  signedAt,
  status,
  userWallet,
}: {
  actionId: string;
  connectionId: string;
  receiptAddress: string | null;
  signature: string | null;
  signedAt: number;
  status: "approved" | "blocked" | "expired" | "rejected";
  userWallet: string;
}): string {
  return [
    "SkillGuard action decision",
    `wallet:${userWallet}`,
    `connection:${connectionId}`,
    `action:${actionId}`,
    `status:${status}`,
    `receiptAddress:${receiptAddress ?? ""}`,
    `signature:${signature ?? ""}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildWalletSessionOwnerMessage({
  signedAt,
  userWallet,
}: {
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard wallet session",
    `wallet:${userWallet}`,
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

    if (agent.publicKey) {
      await request<AgentResponse>("agents", {
        body: JSON.stringify(agent),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
    }

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
      connectionId: string,
      signature: string,
      receiptAddress: string,
      userWallet: string,
      signOwnerMessage: SignOwnerMessage
    ): Promise<ApiActionRecord> {
      const decisionProof = await buildActionDecisionOwnerProof({
        actionId,
        connectionId,
        receiptAddress,
        signature,
        signOwnerMessage,
        status: "approved",
        userWallet,
      });
      const body = await request<ActionResponse>(
        `actions/${encodeURIComponent(actionId)}/decision`,
        {
          body: JSON.stringify({
            decisionProof,
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

    async createWalletSession(
      userWallet: string,
      signOwnerMessage: SignOwnerMessage
    ): Promise<WalletSessionResponse["session"]> {
      const ownerProof = await buildWalletSessionOwnerProof({
        signOwnerMessage,
        userWallet,
      });
      const body = await request<WalletSessionResponse>("wallet-sessions", {
        body: JSON.stringify({ ownerProof, wallet: userWallet }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      return body.session;
    },

    async loadWalletState(
      userWallet: string,
      walletSessionToken: string
    ): Promise<SkillGuardMobileState> {
      const walletHeaders = { "x-skillguard-wallet-session": walletSessionToken };
      const [connectionsBody, actionsBody, agentsBody] = await Promise.all([
        request<ConnectionsResponse>(
          `connections?wallet=${encodeURIComponent(userWallet)}`,
          { headers: walletHeaders }
        ),
        request<ActionsResponse>(`actions?wallet=${encodeURIComponent(userWallet)}`, {
          headers: walletHeaders,
        }),
        request<AgentsResponse>("agents"),
      ]);
      return toMobileState({
        actions: actionsBody.actions,
        agents: agentsBody.agents,
        connections: connectionsBody.connections,
      });
    },

    async registerPushToken(
      userWallet: string,
      walletSessionToken: string,
      token: string
    ): Promise<string[]> {
      const body = await request<{ pushTokens: string[] }>(
        `wallets/${encodeURIComponent(userWallet)}/push-token`,
        {
          body: JSON.stringify({ token }),
          headers: {
            "content-type": "application/json",
            "x-skillguard-wallet-session": walletSessionToken,
          },
          method: "POST",
        }
      );
      return body.pushTokens;
    },

    async removePushToken(
      userWallet: string,
      walletSessionToken: string,
      token: string
    ): Promise<string[]> {
      const body = await request<{ pushTokens: string[] }>(
        `wallets/${encodeURIComponent(userWallet)}/push-token`,
        {
          body: JSON.stringify({ token }),
          headers: {
            "content-type": "application/json",
            "x-skillguard-wallet-session": walletSessionToken,
          },
          method: "DELETE",
        }
      );
      return body.pushTokens;
    },

    async rejectAction(
      actionId: string,
      connectionId: string,
      userWallet: string,
      signOwnerMessage: SignOwnerMessage
    ): Promise<ApiActionRecord> {
      const decisionProof = await buildActionDecisionOwnerProof({
        actionId,
        connectionId,
        receiptAddress: null,
        signature: null,
        signOwnerMessage,
        status: "rejected",
        userWallet,
      });
      const body = await request<ActionResponse>(
        `actions/${encodeURIComponent(actionId)}/decision`,
        {
          body: JSON.stringify({ decisionProof, status: "rejected" }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }
      );
      return body.action;
    },

    async revokeConnection(
      connectionId: string,
      userWallet: string,
      signOwnerMessage: SignOwnerMessage
    ): Promise<ApiConnectionRecord> {
      const ownerProof = await buildConnectionRevokeOwnerProof({
        connectionId,
        signOwnerMessage,
        userWallet,
      });
      const body = await request<ConnectionResponse>(
        `connections/${encodeURIComponent(connectionId)}/revoke`,
        {
          body: JSON.stringify({ ownerProof }),
          headers: { "content-type": "application/json" },
          method: "POST",
        }
      );
      return body.connection;
    },

    async updatePolicyMode(
      connectionId: string,
      _currentPolicy: AgentPolicy,
      mode: ApprovalMode,
      userWallet: string,
      signOwnerMessage: SignOwnerMessage
    ): Promise<ApiConnectionRecord> {
      const policyPatch = { mode };
      const ownerProof = await buildPolicyUpdateOwnerProof({
        connectionId,
        policyPatch,
        signOwnerMessage,
        userWallet,
      });
      const body = await request<ConnectionResponse>(
        `connections/${encodeURIComponent(connectionId)}/policy`,
        {
          body: JSON.stringify({ ownerProof, policyPatch }),
          headers: { "content-type": "application/json" },
          method: "PATCH",
        }
      );
      return body.connection;
    },
  };
}

async function buildPolicyUpdateOwnerProof({
  connectionId,
  policyPatch,
  signOwnerMessage,
  userWallet,
}: {
  connectionId: string;
  policyPatch: Partial<AgentPolicy>;
  signOwnerMessage: SignOwnerMessage;
  userWallet: string;
}): Promise<ConnectionOwnerProof> {
  const signedAt = Date.now();
  const message = buildPolicyUpdateOwnerMessage({
    connectionId,
    policyPatch,
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

async function buildConnectionRevokeOwnerProof({
  connectionId,
  signOwnerMessage,
  userWallet,
}: {
  connectionId: string;
  signOwnerMessage: SignOwnerMessage;
  userWallet: string;
}): Promise<ConnectionOwnerProof> {
  const signedAt = Date.now();
  const message = buildConnectionRevokeOwnerMessage({
    connectionId,
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

async function buildWalletSessionOwnerProof({
  signOwnerMessage,
  userWallet,
}: {
  signOwnerMessage: SignOwnerMessage;
  userWallet: string;
}): Promise<ConnectionOwnerProof> {
  const signedAt = Date.now();
  const message = buildWalletSessionOwnerMessage({
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

async function buildActionDecisionOwnerProof({
  actionId,
  connectionId,
  receiptAddress,
  signature,
  signOwnerMessage,
  status,
  userWallet,
}: {
  actionId: string;
  connectionId: string;
  receiptAddress: string | null;
  signature: string | null;
  signOwnerMessage: SignOwnerMessage;
  status: "approved" | "blocked" | "expired" | "rejected";
  userWallet: string;
}): Promise<ConnectionOwnerProof> {
  const signedAt = Date.now();
  const message = buildActionDecisionOwnerMessage({
    actionId,
    connectionId,
    receiptAddress,
    signature,
    signedAt,
    status,
    userWallet,
  });
  const proofSignature = await signOwnerMessage(new TextEncoder().encode(message));
  return {
    message,
    signatureBase64: Buffer.from(proofSignature).toString("base64"),
    signedAt,
    type: "solana-sign-message",
    wallet: userWallet,
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

function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, sortKeys(record[key])])
  );
}
