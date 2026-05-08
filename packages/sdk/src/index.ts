import type { ActionManifest, DecisionStatus } from "@skillguard/protocol";

type FetchLike = (url: string | URL, init?: RequestInit) => Promise<Response>;

export interface SkillGuardClientOptions {
  agentId: string;
  agentSecret?: string;
  apiUrl: string;
  connectionId?: string;
  fetch?: FetchLike;
}

export interface SkillGuardAction {
  actionId: string;
  decisionStatus: DecisionStatus | null;
}

interface ActionResponse {
  action: SkillGuardAction;
}

const DEFAULT_CONNECTION_ID = "conn-demo";

export function createSkillGuardClient({
  agentId,
  agentSecret,
  apiUrl,
  connectionId = DEFAULT_CONNECTION_ID,
  fetch: fetchImpl = globalThis.fetch,
}: SkillGuardClientOptions) {
  const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetchImpl(new URL(path, baseUrl), {
      ...init,
      headers: {
        ...authHeaders(agentId, agentSecret),
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
      const body = await request<ActionResponse>("actions", {
        body: JSON.stringify({ connectionId, manifest }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      return body.action;
    },
  };
}

function authHeaders(agentId: string, agentSecret?: string): Record<string, string> {
  return {
    ...(agentSecret ? { authorization: `Bearer ${agentSecret}` } : {}),
    "x-skillguard-agent": agentId,
  };
}

export type { ActionManifest, DecisionStatus };
