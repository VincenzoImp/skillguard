import type { ActionManifest, AgentPolicy, PolicyResult } from "@skillguard/protocol";
import { buildAgentActionMessage } from "@skillguard/protocol";
import bs58 from "bs58";
import nacl from "tweetnacl";

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

interface SkillGuardClientOptions {
  agent?: ResearchAgentIdentity;
  agentKeyPair: nacl.SignKeyPair;
  apiUrl: string;
  connectionId: string;
  fetch?: FetchLike;
}

interface ActionResponse {
  action: {
    actionId: string;
    decisionStatus: string | null;
    policyResult?: PolicyResult | null;
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

export interface WaitForDecisionOptions {
  now?: () => number;
  pollMs: number;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs: number;
}

export type WaitForDecisionResult =
  | {
      action: ActionResponse["action"];
      status: "approved" | "blocked" | "expired" | "rejected" | "revoked";
    }
  | { action?: undefined; status: "timeout" };

type TerminalDecisionStatus = Exclude<WaitForDecisionResult["status"], "timeout">;

export function createSkillGuardClient({
  agent = RESEARCH_AGENT,
  agentKeyPair,
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
        body: JSON.stringify({
          ...agent,
          publicKey: publicKeyForKeyPair(agentKeyPair),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      const body = await request<ConnectionResponse>("connections", {
        body: JSON.stringify({
          agentId: agent.agentId,
          connectionId,
          policy: policyForWallet(userWallet, agent.agentId),
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
      const agentProof = agentProofFor({
        agentId: agent.agentId,
        connectionId,
        keyPair: agentKeyPair,
        manifest,
      });
      const actionBody = await request<ActionResponse>("actions", {
        body: JSON.stringify({ agentProof, connectionId, manifest }),
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

    async waitForDecision(
      actionId: string,
      {
        now = Date.now,
        pollMs,
        sleep = defaultSleep,
        timeoutMs,
      }: WaitForDecisionOptions
    ): Promise<WaitForDecisionResult> {
      const startedAt = now();
      while (now() - startedAt < timeoutMs) {
        const body = await request<ActionResponse>(`actions/${actionId}`);
        const status = normalizeDecisionStatus(body.action);
        if (status) {
          return { action: body.action, status };
        }
        await sleep(pollMs);
      }
      return { status: "timeout" };
    },
  };
}

function normalizeDecisionStatus(
  action: ActionResponse["action"]
): TerminalDecisionStatus | null {
  if (action.decisionStatus === "blocked") {
    if (action.policyResult?.reasons.includes("policy_revoked")) {
      return "revoked";
    }
    return "blocked";
  }
  if (
    action.decisionStatus === "approved" ||
    action.decisionStatus === "expired" ||
    action.decisionStatus === "rejected"
  ) {
    return action.decisionStatus;
  }
  return null;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function keyPairFromBase58(value: string): nacl.SignKeyPair {
  const decoded = bs58.decode(value);
  if (decoded.length === 32) {
    return nacl.sign.keyPair.fromSeed(decoded);
  }
  if (decoded.length === 64) {
    return nacl.sign.keyPair.fromSecretKey(decoded);
  }
  throw new Error("agent_private_key_must_be_base58_seed_or_secret_key");
}

export function publicKeyForKeyPair(keyPair: nacl.SignKeyPair): string {
  return bs58.encode(keyPair.publicKey);
}

export function smokeAgentKeyPair(): nacl.SignKeyPair {
  return nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(32));
}

function agentProofFor({
  agentId,
  connectionId,
  keyPair,
  manifest,
}: {
  agentId: string;
  connectionId: string;
  keyPair: nacl.SignKeyPair;
  manifest: ActionManifest;
}) {
  const signedAt = Date.now();
  const message = buildAgentActionMessage({
    agentId,
    connectionId,
    manifest,
    signedAt,
  });
  return {
    agentId,
    message,
    signatureBase64: Buffer.from(
      nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey),
    ).toString("base64"),
    signedAt,
    type: "ed25519-action",
  };
}

export interface ResearchAgentIdentity {
  agentId: string;
  description: string;
  name: string;
}

export const RESEARCH_AGENT: ResearchAgentIdentity = {
  agentId: "agent-research",
  description: "Solana demo agent that requests wallet-safe actions.",
  name: "Demo Agent",
};

export function connectionIdForWallet(userWallet: string, agentId = RESEARCH_AGENT.agentId): string {
  return `conn-${agentId}-${userWallet}`;
}

function policyForWallet(
  userWallet: string,
  agentId = RESEARCH_AGENT.agentId
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
