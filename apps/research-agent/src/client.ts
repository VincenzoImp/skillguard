import type { ActionManifest, AgentPolicy, PolicyResult } from "@skillguard/protocol";
import { buildAgentActionMessage } from "@skillguard/protocol";
import bs58 from "bs58";
import nacl from "tweetnacl";

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

interface SkillGuardClientOptions {
  agentKeyPair: nacl.SignKeyPair;
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
          ...RESEARCH_AGENT,
          publicKey: publicKeyForKeyPair(agentKeyPair),
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });

      const body = await request<ConnectionResponse>("connections", {
        body: JSON.stringify({
          agentId: RESEARCH_AGENT.agentId,
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
      const agentProof = agentProofFor({
        agentId: RESEARCH_AGENT.agentId,
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
  };
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

export const RESEARCH_AGENT = {
  agentId: "agent-research",
  description: "Solana research agent that requests wallet-safe actions.",
  name: "Research Agent",
};

export function connectionIdForWallet(userWallet: string, agentId = RESEARCH_AGENT.agentId): string {
  return `conn-${agentId}-${userWallet}`;
}

function policyForWallet(userWallet: string): AgentPolicy {
  return {
    active: true,
    agentId: RESEARCH_AGENT.agentId,
    allowedMints: ["SOL", "USDC"],
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: ["helius", "birdeye"],
    dailySpendCapAtomic: "5000000",
    expiresAt: 4_100_000_000,
    maxSpendAtomic: "1000000",
    mode: "ask_every_time",
    policyId: `policy-${RESEARCH_AGENT.agentId}-${userWallet}`,
    revoked: false,
    userWallet,
  };
}
