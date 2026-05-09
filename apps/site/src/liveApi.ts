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
    description: "Register or upsert an immutable agent public key.",
  },
  {
    method: "POST",
    path: "/api/wallet-sessions",
    description: "Create a short-lived wallet read session with ownerProof.",
  },
  {
    method: "GET",
    path: "/api/connections?wallet=<wallet>",
    description: "List agent connections for a wallet.",
  },
  {
    method: "POST",
    path: "/api/connections",
    description: "Connect an agent to a wallet policy with ownerProof.",
  },
  {
    method: "PATCH",
    path: "/api/connections/:connectionId/policy",
    description: "Edit policy limits and approval mode with ownerProof.",
  },
  {
    method: "POST",
    path: "/api/connections/:connectionId/revoke",
    description: "Revoke an agent connection with ownerProof.",
  },
  {
    method: "POST",
    path: "/api/wallets/:wallet/push-token",
    description: "Register a wallet-scoped Expo push token with wallet-session auth.",
  },
  {
    method: "DELETE",
    path: "/api/wallets/:wallet/push-token",
    description: "Remove a device push token for logout or device migration.",
  },
  {
    method: "POST",
    path: "/api/actions",
    description: "Submit a signed ActionManifest for policy evaluation.",
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
    description: "Record approval, rejection, blocked, or expired decision with ownerProof.",
  },
];

export const liveApiCurlExamples = [
  {
    title: "Health",
    command: `curl ${liveApiBaseUrl}/health`,
  },
  {
    title: "Run autonomous research-agent loop",
    command: `export SKILLGUARD_API_URL=${liveApiBaseUrl}
export SKILLGUARD_USER_WALLET=<connected-wallet>
npm --prefix apps/research-agent run agent:loop`,
  },
  {
    title: "Run Android against hosted API",
    command: `EXPO_PUBLIC_SKILLGUARD_API_URL=${liveApiBaseUrl} npm --prefix apps/mobile run android`,
  },
];
