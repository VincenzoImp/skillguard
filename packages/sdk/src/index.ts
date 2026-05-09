import type { ActionManifest, AgentActionProof, DecisionStatus } from "@skillguard/protocol";
import { buildAgentActionMessage } from "@skillguard/protocol";

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

export interface SkillGuardClientOptions {
  agentId: string;
  agentSigner?: SkillGuardAgentSigner;
  apiUrl: string;
  connectionId?: string;
  fetch?: FetchLike;
}

export interface SkillGuardAgentSigner {
  publicKey: string;
  signMessage(message: Uint8Array): Promise<Uint8Array> | Uint8Array;
}

export interface SkillGuardAction {
  actionId: string;
  decisionStatus: DecisionStatus | null;
}

interface ActionResponse {
  action: SkillGuardAction;
}

export function createSkillGuardClient({
  agentId,
  agentSigner,
  apiUrl,
  connectionId,
  fetch: fetchImpl = globalThis.fetch,
}: SkillGuardClientOptions) {
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(new URL(path, baseUrl), {
      ...init,
      headers: {
        "x-skillguard-agent": agentId,
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`SkillGuard API ${response.status} for ${path}`);
    }

    return (await response.json()) as T;
  }

  return {
    async onDecision(actionId: string): Promise<DecisionStatus | null> {
      const body = await request<ActionResponse>(`actions/${actionId}`);
      return body.action.decisionStatus;
    },

    async submitAction(manifest: ActionManifest): Promise<SkillGuardAction> {
      if (!connectionId) {
        throw new Error("connection_id_required");
      }
      if (!agentSigner) {
        throw new Error("agent_signer_required");
      }

      const agentProof = await buildAgentProof({
        agentId,
        connectionId,
        manifest,
        signer: agentSigner,
      });

      const body = await request<ActionResponse>("actions", {
        body: JSON.stringify({ agentProof, connectionId, manifest }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      return body.action;
    },
  };
}

async function buildAgentProof({
  agentId,
  connectionId,
  manifest,
  signer,
}: {
  agentId: string;
  connectionId: string;
  manifest: ActionManifest;
  signer: SkillGuardAgentSigner;
}): Promise<AgentActionProof> {
  const signedAt = Date.now();
  const message = buildAgentActionMessage({
    agentId,
    connectionId,
    manifest,
    signedAt,
  });
  const signature = await signer.signMessage(new TextEncoder().encode(message));
  return {
    agentId,
    message,
    signatureBase64: Buffer.from(signature).toString("base64"),
    signedAt,
    type: "ed25519-action",
  };
}

export type { ActionManifest, AgentActionProof, DecisionStatus };
