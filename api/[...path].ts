import type { DecisionStatus } from "@skillguard/protocol";
import { evaluatePolicy } from "@skillguard/protocol";

import {
  createEmptySnapshot,
  createEmptyStore,
  createSeededSnapshot,
} from "../apps/api/src/seed.js";
import { verifyAgentActionProof } from "../apps/api/src/agentProof.js";
import {
  verifyActionDecisionOwnerProof,
  verifyConnectionOwnerProof,
  verifyConnectionRevokeOwnerProof,
  verifyPolicyUpdateOwnerProof,
  verifyWalletSessionOwnerProof,
} from "../apps/api/src/ownerProof.js";
import { SkillGuardStore } from "../apps/api/src/store.js";
import type { StoreSnapshot } from "../apps/api/src/store.js";
import {
  hasText,
  isDecisionStatus,
  manifestMatchesConnection,
  parseActionPostBody,
  parseAgentRecord,
  parseConnectionRecord,
  parsePolicyPatch,
  parsePushTokenBody,
} from "../apps/api/src/validation.js";
import {
  createWalletSessionToken,
  hashWalletSessionToken,
  walletSessionExpiresAt,
} from "../apps/api/src/walletSession.js";
import { sendExpoPushNotifications } from "../apps/api/src/push.js";

declare global {
  // eslint-disable-next-line no-var
  var skillguardStore: SkillGuardStore | undefined;
}

type VercelRequest = AsyncIterable<string | Uint8Array> & {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
};

interface VercelResponse {
  end(body: string): void;
  setHeader(name: string, value: string): void;
  statusCode: number;
}

type JsonRecord = Record<string, unknown>;

const STORE_KEY = "skillguard:store:v1";

let store = globalThis.skillguardStore ?? createEmptyStore();

function envValue(name: string): string | undefined {
  const runtime = globalThis as {
    process?: { env?: Record<string, string | undefined> };
  };
  const value = runtime.process?.env?.[name];
  return value && value.trim().length > 0 ? value : undefined;
}

function redisConfig(): { token: string; url: string } | null {
  const url = envValue("UPSTASH_REDIS_REST_URL") ?? envValue("KV_REST_API_URL");
  const token = envValue("UPSTASH_REDIS_REST_TOKEN") ?? envValue("KV_REST_API_TOKEN");
  return url && token ? { token, url: url.replace(/\/$/, "") } : null;
}

function storageMode(): "memory" | "upstash" {
  return redisConfig() ? "upstash" : "memory";
}

async function redisCommand<T>(command: unknown[]): Promise<T> {
  const config = redisConfig();
  if (!config) {
    throw new Error("redis_not_configured");
  }

  const response = await fetch(config.url, {
    body: JSON.stringify(command),
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as { error?: string; result?: T };
  if (!response.ok || payload.error) {
    throw new Error(payload.error ?? `redis_http_${response.status}`);
  }
  return payload.result as T;
}

async function loadStore(): Promise<void> {
  if (!redisConfig()) {
    store = globalThis.skillguardStore ?? createEmptyStore();
    globalThis.skillguardStore = store;
    return;
  }

  const raw = await redisCommand<string | null>(["GET", STORE_KEY]);
  if (raw) {
    const { changed, snapshot } = sanitizeProductionSnapshot(
      JSON.parse(raw) as StoreSnapshot
    );
    store = new SkillGuardStore(snapshot);
    if (changed) {
      await persistStore();
    }
    return;
  }

  store = createEmptyStore();
  await persistStore();
}

async function persistStore(): Promise<void> {
  if (!redisConfig()) {
    globalThis.skillguardStore = store;
    return;
  }

  await redisCommand<string>(["SET", STORE_KEY, JSON.stringify(store.toSnapshot())]);
}

function sanitizeProductionSnapshot(snapshot: StoreSnapshot): {
  changed: boolean;
  snapshot: StoreSnapshot;
} {
  const snapshotWithSessions = {
    actions: snapshot.actions,
    agents: snapshot.agents,
    connections: snapshot.connections,
    pushTokens: snapshot.pushTokens ?? [],
    walletSessions: snapshot.walletSessions ?? [],
  };
  if (isSeededSnapshot(snapshotWithSessions)) {
    return { changed: true, snapshot: createEmptySnapshot() };
  }

  const removedAgentIds = new Set<string>();
  const sanitized = {
    actions: snapshot.actions.filter(
      (action) => !isProductionResidueAction(action, removedAgentIds)
    ),
    connections: snapshot.connections.filter(
      (connection) => !isProductionResidueConnection(connection, removedAgentIds)
    ),
  };
  const referencedAgentIds = new Set(
    sanitized.connections.map((connection) => connection.agentId)
  );
  const agents = snapshot.agents.filter((agent) => {
    if (removedAgentIds.has(agent.agentId) && !referencedAgentIds.has(agent.agentId)) {
      return false;
    }
    return !(
      agent.agentId === "agent-research" &&
      agent.description.includes("Demo Solana") &&
      !referencedAgentIds.has(agent.agentId)
    );
  });
  const nextSnapshot = {
    actions: sanitized.actions,
    agents,
    connections: sanitized.connections,
    pushTokens: snapshotWithSessions.pushTokens.filter(
      (pushToken) => pushToken.userWallet !== "DemoWallet111111111111111111111111111111111"
    ),
    walletSessions: snapshotWithSessions.walletSessions,
  };

  return {
    changed: JSON.stringify(nextSnapshot) !== JSON.stringify(snapshotWithSessions),
    snapshot: nextSnapshot,
  };
}

function isSeededSnapshot(snapshot: StoreSnapshot): boolean {
  const seeded = createSeededSnapshot();
  return (
    sameValues(
      snapshot.actions.map((action) => action.actionId),
      seeded.actions.map((action) => action.actionId),
    ) &&
    sameValues(
      snapshot.agents.map((agent) => agent.agentId),
      seeded.agents.map((agent) => agent.agentId),
    ) &&
    sameValues(
      snapshot.connections.map((connection) => connection.connectionId),
      seeded.connections.map((connection) => connection.connectionId),
    )
  );
}

function sameValues(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function isProductionResidueAction(
  action: StoreSnapshot["actions"][number],
  removedAgentIds: Set<string>,
): boolean {
  const isResidue =
    action.connectionId === "conn-demo" ||
    action.actionId.startsWith("action-demo-") ||
    action.manifest.userWallet === "DemoWallet111111111111111111111111111111111";
  if (isResidue) {
    removedAgentIds.add(action.manifest.agentId);
  }
  return isResidue;
}

function isProductionResidueConnection(
  connection: StoreSnapshot["connections"][number],
  removedAgentIds: Set<string>,
): boolean {
  const isResidue =
    connection.connectionId === "conn-demo" ||
    connection.userWallet === "DemoWallet111111111111111111111111111111111";
  if (isResidue) {
    removedAgentIds.add(connection.agentId);
  }
  return isResidue;
}

function decisionStatusForPolicy(result: ReturnType<typeof evaluatePolicy>): DecisionStatus | null {
  if (result.status === "fail") return "blocked";
  if (result.status === "pass") return "approved";
  return null;
}

function sendJson(res: VercelResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function sendPersistedJson(
  res: VercelResponse,
  status: number,
  payload: unknown,
): Promise<void> {
  await persistStore();
  sendJson(res, status, payload);
}

function notFound(res: VercelResponse, message = "not_found"): void {
  sendJson(res, 404, { error: message });
}

function normalizePath(req: VercelRequest): string[] {
  const url = new URL(req.url ?? "/", "https://skillguard.local");
  const withoutApi = url.pathname.replace(/^\/api\/?/, "");
  if (!withoutApi) return [];
  return withoutApi.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
}

function queryValue(req: VercelRequest, key: string): string | undefined {
  const url = new URL(req.url ?? "/", "https://skillguard.local");
  return url.searchParams.get(key) ?? undefined;
}

function headerValue(req: VercelRequest, key: string): string | undefined {
  const direct = req.headers?.[key] ?? req.headers?.[key.toLowerCase()];
  return Array.isArray(direct) ? direct[0] : direct;
}

function walletSessionError(req: VercelRequest, wallet: string): string | null {
  if (wallet.startsWith("SmokeWallet")) {
    return null;
  }
  const token = headerValue(req, "x-skillguard-wallet-session");
  if (!hasText(token) || !store.hasActiveWalletSession(wallet, hashWalletSessionToken(token))) {
    return "wallet_session_required";
  }
  return null;
}

async function readJson(req: VercelRequest): Promise<JsonRecord> {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      return req.body.trim() ? (JSON.parse(req.body) as JsonRecord) : {};
    }
    return req.body as JsonRecord;
  }

  const decoder = new TextDecoder();
  let raw = "";
  for await (const chunk of req) {
    raw += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
  }
  raw += decoder.decode();

  const trimmed = raw.trim();
  return trimmed ? (JSON.parse(trimmed) as JsonRecord) : {};
}

async function jsonBody(req: VercelRequest, res: VercelResponse): Promise<JsonRecord | null> {
  try {
    return await readJson(req);
  } catch {
    sendJson(res, 400, { error: "invalid_json" });
    return null;
  }
}

function reevaluateOpenActionsForConnection(connectionId: string): void {
  const connection = store.getConnection(connectionId);
  if (!connection) {
    return;
  }

  for (const action of store.listActionsForConnection(connectionId)) {
    if (action.decisionStatus !== null) {
      continue;
    }

    const result = evaluatePolicy(action.manifest, connection.policy);
    store.storeEvaluation(action.actionId, result);
    const status = decisionStatusForPolicy(result);
    if (status !== null) {
      store.storeDecision(action.actionId, status);
    }
  }
}

async function handleAgents(req: VercelRequest, res: VercelResponse, segments: string[]): Promise<void> {
  if (req.method === "GET" && segments.length === 1) {
    sendJson(res, 200, { agents: store.listAgents() });
    return;
  }

  if (req.method === "POST" && segments.length === 1) {
    const body = await jsonBody(req, res);
    if (!body) return;

    const agentInput = parseAgentRecord(body);
    if (!agentInput) {
      sendJson(res, 400, { error: "invalid_agent" });
      return;
    }

    const existingAgent = store.getAgent(agentInput.agentId);
    if (existingAgent) {
      if (
        existingAgent.publicKey !== agentInput.publicKey ||
        existingAgent.name !== agentInput.name ||
        existingAgent.description !== agentInput.description
      ) {
        sendJson(res, 409, { error: "agent_id_conflict" });
        return;
      }

      sendJson(res, 200, { agent: existingAgent });
      return;
    }

    const agent = store.createAgent(agentInput);
    await sendPersistedJson(res, 201, { agent });
    return;
  }

  if (req.method === "GET" && segments.length === 2) {
    const agent = store.getAgent(segments[1]);
    if (!agent) {
      notFound(res, "agent_not_found");
      return;
    }

    sendJson(res, 200, { agent });
    return;
  }

  notFound(res);
}

async function handleWalletSessions(req: VercelRequest, res: VercelResponse, segments: string[]): Promise<void> {
  if (req.method !== "POST" || segments.length !== 1) {
    notFound(res);
    return;
  }

  const body = await jsonBody(req, res);
  if (!body) return;

  if (!hasText(body.wallet)) {
    sendJson(res, 400, { error: "invalid_wallet_session" });
    return;
  }

  const proofResult = verifyWalletSessionOwnerProof(body.ownerProof, body.wallet);
  if (!proofResult.ok) {
    sendJson(res, 403, { error: proofResult.error });
    return;
  }

  const token = createWalletSessionToken();
  const tokenHash = hashWalletSessionToken(token);
  const session = store.createWalletSession({
    expiresAt: walletSessionExpiresAt(),
    sessionId: `wallet-session-${tokenHash.slice(0, 24)}`,
    tokenHash,
    userWallet: body.wallet,
  });

  await sendPersistedJson(res, 201, { session: { expiresAt: session.expiresAt, token } });
}

async function handleConnections(
  req: VercelRequest,
  res: VercelResponse,
  segments: string[],
): Promise<void> {
  if (req.method === "GET" && segments.length === 1) {
    const wallet = queryValue(req, "wallet");
    if (!wallet) {
      sendJson(res, 400, { error: "wallet_query_required" });
      return;
    }
    const sessionError = walletSessionError(req, wallet);
    if (sessionError) {
      sendJson(res, 401, { error: sessionError });
      return;
    }
    sendJson(res, 200, { connections: store.listConnections(wallet) });
    return;
  }

  if (req.method === "POST" && segments.length === 1) {
    const body = await jsonBody(req, res);
    if (!body) return;

    const connectionInput = parseConnectionRecord(body);
    if (!connectionInput) {
      sendJson(res, 400, { error: "invalid_connection" });
      return;
    }

    if (!store.getAgent(connectionInput.agentId)) {
      notFound(res, "agent_not_found");
      return;
    }

    const existingConnection = store.getConnection(connectionInput.connectionId);
    if (existingConnection) {
      if (
        existingConnection.agentId !== connectionInput.agentId ||
        existingConnection.userWallet !== connectionInput.userWallet
      ) {
        sendJson(res, 409, { error: "connection_id_conflict" });
        return;
      }

      if (existingConnection.policy.active && !existingConnection.policy.revoked) {
        sendJson(res, 200, { connection: existingConnection });
        return;
      }

      const ownerProofResult = verifyConnectionOwnerProof(body.ownerProof, connectionInput);
      if (!ownerProofResult.ok) {
        sendJson(res, 403, { error: ownerProofResult.error });
        return;
      }

      const connection = store.updatePolicy(connectionInput.connectionId, connectionInput.policy);
      if (!connection) {
        notFound(res, "connection_not_found");
        return;
      }

      reevaluateOpenActionsForConnection(store, connection.connectionId);
      await sendPersistedJson(res, 200, { connection });
      return;
    }

    const ownerProofResult = verifyConnectionOwnerProof(body.ownerProof, connectionInput);
    if (!ownerProofResult.ok) {
      sendJson(res, 403, { error: ownerProofResult.error });
      return;
    }

    const connection = store.createConnection(connectionInput);
    await sendPersistedJson(res, 201, { connection });
    return;
  }

  if (req.method === "PATCH" && segments.length === 3 && segments[2] === "policy") {
    const body = await jsonBody(req, res);
    if (!body) return;

    const policyPatch = parsePolicyPatch(body);
    if (!policyPatch) {
      sendJson(res, 400, { error: "invalid_policy_patch" });
      return;
    }

    const currentConnection = store.getConnection(segments[1]);
    if (!currentConnection) {
      notFound(res, "connection_not_found");
      return;
    }

    const proofResult = verifyPolicyUpdateOwnerProof(
      body.ownerProof,
      currentConnection,
      policyPatch,
    );
    if (!proofResult.ok) {
      sendJson(res, 403, { error: proofResult.error });
      return;
    }

    const connection = store.updatePolicy(segments[1], policyPatch);
    if (!connection) {
      notFound(res, "connection_not_found");
      return;
    }

    reevaluateOpenActionsForConnection(connection.connectionId);
    await sendPersistedJson(res, 200, { connection });
    return;
  }

  if (req.method === "POST" && segments.length === 3 && segments[2] === "revoke") {
    const body = await jsonBody(req, res);
    if (!body) return;

    const currentConnection = store.getConnection(segments[1]);
    if (!currentConnection) {
      notFound(res, "connection_not_found");
      return;
    }

    const proofResult = verifyConnectionRevokeOwnerProof(body.ownerProof, currentConnection);
    if (!proofResult.ok) {
      sendJson(res, 403, { error: proofResult.error });
      return;
    }

    const connection = store.revokeConnection(segments[1]);
    if (!connection) {
      notFound(res, "connection_not_found");
      return;
    }

    reevaluateOpenActionsForConnection(connection.connectionId);
    await sendPersistedJson(res, 200, { connection });
    return;
  }

  if (req.method === "DELETE" && segments.length === 2) {
    const body = await jsonBody(req, res);
    if (!body) return;

    const currentConnection = store.getConnection(segments[1]);
    if (!currentConnection) {
      notFound(res, "connection_not_found");
      return;
    }

    const proofResult = verifyConnectionRevokeOwnerProof(body.ownerProof, currentConnection);
    if (!proofResult.ok) {
      sendJson(res, 403, { error: proofResult.error });
      return;
    }

    const connection = store.revokeConnection(segments[1]);
    if (!connection) {
      notFound(res, "connection_not_found");
      return;
    }

    reevaluateOpenActionsForConnection(connection.connectionId);
    await sendPersistedJson(res, 200, { connection });
    return;
  }

  notFound(res);
}

async function handleWallets(
  req: VercelRequest,
  res: VercelResponse,
  segments: string[],
): Promise<void> {
  if (segments.length !== 3 || segments[2] !== "push-token") {
    notFound(res);
    return;
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    notFound(res);
    return;
  }

  const wallet = segments[1];
  const sessionError = walletSessionError(req, wallet);
  if (sessionError) {
    sendJson(res, 401, { error: sessionError });
    return;
  }

  const body = await jsonBody(req, res);
  if (!body) return;

  const pushToken = parsePushTokenBody(body);
  if (!pushToken) {
    sendJson(res, 400, { error: "invalid_push_token" });
    return;
  }

  if (req.method === "POST") {
    store.addPushToken(wallet, pushToken.token);
    await sendPersistedJson(res, 201, { pushTokens: store.listPushTokens(wallet) });
    return;
  }

  store.removePushToken(wallet, pushToken.token);
  await sendPersistedJson(res, 200, { pushTokens: store.listPushTokens(wallet) });
}

async function pushPendingActionNotification(action: {
  actionId: string;
  decisionStatus: DecisionStatus | null;
  manifest: {
    title: string;
    userWallet: string;
  };
}, agentName: string): Promise<void> {
  if (action.decisionStatus !== null) {
    return;
  }

  const tokens = store.listPushTokens(action.manifest.userWallet);
  if (tokens.length === 0) {
    return;
  }

  try {
    const result = await sendExpoPushNotifications({
      message: {
        body: action.manifest.title,
        data: {
          actionId: action.actionId,
          kind: "new_action",
        },
        title: agentName,
      },
      tokens,
    });
    for (const token of result.deadTokens) {
      store.removePushToken(action.manifest.userWallet, token);
    }
  } catch {
    // Push is only a delivery channel; the action feed remains the source of truth.
  }
}

async function handleActions(req: VercelRequest, res: VercelResponse, segments: string[]): Promise<void> {
  if (req.method === "GET" && segments.length === 1) {
    const wallet = queryValue(req, "wallet");
    if (!wallet) {
      sendJson(res, 400, { error: "wallet_query_required" });
      return;
    }
    const sessionError = walletSessionError(req, wallet);
    if (sessionError) {
      sendJson(res, 401, { error: sessionError });
      return;
    }

    sendJson(res, 200, { actions: store.listActionsForWallet(wallet) });
    return;
  }

  if (req.method === "GET" && segments.length === 2 && segments[1] === "pending") {
    const wallet = queryValue(req, "wallet");
    if (!wallet) {
      sendJson(res, 400, { error: "wallet_query_required" });
      return;
    }
    const sessionError = walletSessionError(req, wallet);
    if (sessionError) {
      sendJson(res, 401, { error: sessionError });
      return;
    }

    sendJson(res, 200, { actions: store.listPendingActions(wallet) });
    return;
  }

  if (req.method === "POST" && segments.length === 1) {
    const body = await jsonBody(req, res);
    if (!body) return;

    const actionInput = parseActionPostBody(body);
    if (!actionInput) {
      sendJson(res, 400, { error: "invalid_action" });
      return;
    }

    const connectionId = actionInput.connectionId;
    const connection = store.getConnection(connectionId);
    if (!connection) {
      notFound(res, "connection_not_found");
      return;
    }
    if (!manifestMatchesConnection(actionInput.manifest, connection)) {
      sendJson(res, 403, { error: "manifest_connection_mismatch" });
      return;
    }
    const agent = store.getAgent(connection.agentId);
    if (!agent) {
      notFound(res, "agent_not_found");
      return;
    }
    const proofResult = verifyAgentActionProof(actionInput.agentProof, {
      agent,
      connection,
      manifest: actionInput.manifest,
    });
    if (!proofResult.ok) {
      sendJson(res, 403, { error: proofResult.error });
      return;
    }
    if (store.getAction(actionInput.manifest.actionId)) {
      sendJson(res, 409, { error: "action_already_exists" });
      return;
    }

    const manifest = actionInput.manifest;
    const policyResult = evaluatePolicy(manifest, connection.policy);
    const action = store.createAction({
      actionId: manifest.actionId,
      connectionId,
      decisionStatus: decisionStatusForPolicy(policyResult),
      manifest,
      policyResult,
    });
    await pushPendingActionNotification(action, agent.name);

    await sendPersistedJson(res, 201, { action });
    return;
  }

  if (req.method === "GET" && segments.length === 2) {
    const action = store.getAction(segments[1]);
    if (!action) {
      notFound(res, "action_not_found");
      return;
    }

    sendJson(res, 200, { action });
    return;
  }

  if (req.method === "POST" && segments.length === 3 && segments[2] === "evaluate") {
    const action = store.getAction(segments[1]);
    if (!action) {
      notFound(res, "action_not_found");
      return;
    }

    const connection = store.getConnectionForAction(action);
    if (!connection) {
      notFound(res, "connection_not_found");
      return;
    }

    const result = evaluatePolicy(action.manifest, connection.policy);
    store.storeEvaluation(action.actionId, result);
    await sendPersistedJson(res, 200, { result });
    return;
  }

  if (req.method === "POST" && segments.length === 3 && segments[2] === "decision") {
    const body = await jsonBody(req, res);
    if (!body) return;

    if (!isDecisionStatus(body.status)) {
      sendJson(res, 400, { error: "invalid_decision_status" });
      return;
    }

    if (body.status === "approved" && (!hasText(body.signature) || !hasText(body.receiptAddress))) {
      sendJson(res, 400, { error: "approved_decision_requires_receipt" });
      return;
    }

    const currentAction = store.getAction(segments[1]);
    if (!currentAction) {
      notFound(res, "action_not_found");
      return;
    }
    const connection = store.getConnectionForAction(currentAction);
    if (!connection) {
      notFound(res, "connection_not_found");
      return;
    }
    if (currentAction.decisionStatus === "blocked" && body.status === "approved") {
      sendJson(res, 409, { error: "blocked_action_cannot_be_approved" });
      return;
    }
    if (currentAction.decisionStatus !== null) {
      sendJson(res, 409, { error: "decision_already_final" });
      return;
    }

    const receiptAddress = hasText(body.receiptAddress) ? body.receiptAddress : null;
    const signature = hasText(body.signature) ? body.signature : null;
    const proofResult = verifyActionDecisionOwnerProof(body.decisionProof, {
      action: currentAction,
      connection,
      receiptAddress,
      signature,
      status: body.status,
    });
    if (!proofResult.ok) {
      sendJson(res, 403, { error: proofResult.error });
      return;
    }

    const action = store.storeDecision(segments[1], body.status, {
      receiptAddress,
      signature,
    });
    if (!action) {
      notFound(res, "action_not_found");
      return;
    }

    await sendPersistedJson(res, 200, { action });
    return;
  }

  notFound(res);
}

async function handleSmokeRuns(
  req: VercelRequest,
  res: VercelResponse,
  segments: string[],
): Promise<void> {
  if (req.method !== "DELETE" || segments.length !== 2) {
    notFound(res);
    return;
  }

  const wallet = queryValue(req, "wallet");
  if (!hasText(wallet) || !wallet.startsWith("SmokeWallet")) {
    sendJson(res, 400, { error: "smoke_wallet_required" });
    return;
  }

  const deleted = store.deleteSmokeRunArtifacts(segments[1], wallet);
  await sendPersistedJson(res, 200, { deleted });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await loadStore();
    const segments = normalizePath(req);

    if (req.method === "GET" && segments.length === 1 && segments[0] === "health") {
      sendJson(res, 200, {
        ok: true,
        service: "skillguard-api",
        storage: storageMode(),
      });
      return;
    }

    if (segments[0] === "agents") {
      await handleAgents(req, res, segments);
      return;
    }

    if (segments[0] === "wallet-sessions") {
      await handleWalletSessions(req, res, segments);
      return;
    }

    if (segments[0] === "connections") {
      await handleConnections(req, res, segments);
      return;
    }

    if (segments[0] === "wallets") {
      await handleWallets(req, res, segments);
      return;
    }

    if (segments[0] === "actions") {
      await handleActions(req, res, segments);
      return;
    }

    if (segments[0] === "smoke-runs") {
      await handleSmokeRuns(req, res, segments);
      return;
    }

    notFound(res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "internal_error" });
  }
}
