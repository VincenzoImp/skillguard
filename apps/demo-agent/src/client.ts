import type { ActionManifest, PolicyResult } from "@skillguard/protocol";

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
