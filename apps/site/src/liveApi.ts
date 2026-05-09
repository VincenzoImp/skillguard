export const liveSiteUrl = "https://skillguard-sol.vercel.app";
export const liveApiBaseUrl = `${liveSiteUrl}/api`;

export type LiveApiEndpoint = {
  description: string;
  method: "DELETE" | "GET" | "PATCH" | "POST";
  path: string;
};

export const liveApiEndpoints: LiveApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/health",
    description: "Check service status and storage mode.",
  },
  {
    method: "GET",
    path: "/api/agents",
    description: "List registered agents.",
  },
  {
    method: "POST",
    path: "/api/agents",
    description: "Register or upsert an agent identity.",
  },
  {
    method: "GET",
    path: "/api/connections?wallet=<wallet>",
    description: "List agent connections for a wallet.",
  },
  {
    method: "POST",
    path: "/api/connections",
    description: "Connect an agent to a wallet policy.",
  },
  {
    method: "PATCH",
    path: "/api/connections/:connectionId/policy",
    description: "Edit policy limits and approval mode.",
  },
  {
    method: "POST",
    path: "/api/connections/:connectionId/revoke",
    description: "Revoke an agent connection.",
  },
  {
    method: "POST",
    path: "/api/actions",
    description: "Submit an ActionManifest for policy evaluation.",
  },
  {
    method: "GET",
    path: "/api/actions?wallet=<wallet>",
    description: "Read wallet action history.",
  },
  {
    method: "POST",
    path: "/api/actions/:actionId/evaluate",
    description: "Re-run policy evaluation for an action.",
  },
  {
    method: "POST",
    path: "/api/actions/:actionId/decision",
    description: "Record approval, rejection, blocked, or expired decision.",
  },
];

export const liveApiCurlExamples = [
  {
    title: "Health",
    command: `curl ${liveApiBaseUrl}/health`,
  },
  {
    title: "Submit safe demo action",
    command: `export SKILLGUARD_API_URL=${liveApiBaseUrl}
export SKILLGUARD_USER_WALLET=<connected-wallet>
npm --prefix apps/research-agent run submit:safe`,
  },
  {
    title: "Run Android against hosted API",
    command: `EXPO_PUBLIC_SKILLGUARD_API_URL=${liveApiBaseUrl} npm --prefix apps/mobile run android`,
  },
];
