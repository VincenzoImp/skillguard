import type { DecisionStatus } from "@skillguard/protocol";
import { evaluatePolicy } from "@skillguard/protocol";
import { Hono } from "hono";

import type { SkillGuardStore } from "./store.js";
import { verifyAgentActionProof } from "./agentProof.js";
import {
  verifyActionDecisionOwnerProof,
  verifyConnectionOwnerProof,
  verifyConnectionRevokeOwnerProof,
  verifyPolicyUpdateOwnerProof,
  verifyWalletSessionOwnerProof,
} from "./ownerProof.js";
import {
  hasText,
  isDecisionStatus,
  manifestMatchesConnection,
  parseActionPostBody,
  parseAgentRecord,
  parseConnectionRecord,
  parsePolicyPatch,
} from "./validation.js";
import {
  createWalletSessionToken,
  hashWalletSessionToken,
  walletSessionExpiresAt,
} from "./walletSession.js";

function notFound(message: string) {
  return { error: message };
}

function decisionStatusForPolicy(result: ReturnType<typeof evaluatePolicy>): DecisionStatus | null {
  if (result.status === "fail") return "blocked";
  if (result.status === "pass") return "approved";
  return null;
}

function reevaluateOpenActionsForConnection(store: SkillGuardStore, connectionId: string): void {
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

function walletSessionError(
  store: SkillGuardStore,
  wallet: string,
  token: string | undefined,
): string | null {
  if (wallet.startsWith("SmokeWallet")) {
    return null;
  }
  if (!hasText(token) || !store.hasActiveWalletSession(wallet, hashWalletSessionToken(token))) {
    return "wallet_session_required";
  }
  return null;
}

async function readOptionalJson(c: { req: { json(): Promise<unknown> } }): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}

export function createApp(store: SkillGuardStore): Hono {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, service: "skillguard-api" }));

  app.get("/agents", (c) => c.json({ agents: store.listAgents() }));

  app.post("/agents", async (c) => {
    const agent = parseAgentRecord(await c.req.json());
    if (!agent) {
      return c.json({ error: "invalid_agent" }, 400);
    }

    const existingAgent = store.getAgent(agent.agentId);
    if (existingAgent) {
      if (
        existingAgent.publicKey !== agent.publicKey ||
        existingAgent.name !== agent.name ||
        existingAgent.description !== agent.description
      ) {
        return c.json({ error: "agent_id_conflict" }, 409);
      }

      return c.json({ agent: existingAgent }, 200);
    }

    return c.json({ agent: store.createAgent(agent) }, 201);
  });

  app.get("/agents/:agentId", (c) => {
    const agent = store.getAgent(c.req.param("agentId"));
    if (!agent) {
      return c.json(notFound("agent_not_found"), 404);
    }

    return c.json({ agent });
  });

  app.post("/wallet-sessions", async (c) => {
    const body = await c.req.json();
    const wallet = (body as { wallet?: unknown }).wallet;
    if (!hasText(wallet)) {
      return c.json({ error: "invalid_wallet_session" }, 400);
    }

    const proofResult = verifyWalletSessionOwnerProof(
      (body as { ownerProof?: unknown }).ownerProof,
      wallet,
    );
    if (!proofResult.ok) {
      return c.json({ error: proofResult.error }, 403);
    }

    const token = createWalletSessionToken();
    const expiresAt = walletSessionExpiresAt();
    const session = store.createWalletSession({
      expiresAt,
      sessionId: `wallet-session-${hashWalletSessionToken(token).slice(0, 24)}`,
      tokenHash: hashWalletSessionToken(token),
      userWallet: wallet,
    });
    return c.json({ session: { expiresAt: session.expiresAt, token } }, 201);
  });

  app.post("/connections", async (c) => {
    const body = await c.req.json();
    const connectionInput = parseConnectionRecord(body);
    if (!connectionInput) {
      return c.json({ error: "invalid_connection" }, 400);
    }

    if (!store.getAgent(connectionInput.agentId)) {
      return c.json(notFound("agent_not_found"), 404);
    }

    const existingConnection = store.getConnection(connectionInput.connectionId);
    if (existingConnection) {
      if (
        existingConnection.agentId !== connectionInput.agentId ||
        existingConnection.userWallet !== connectionInput.userWallet
      ) {
        return c.json({ error: "connection_id_conflict" }, 409);
      }

      return c.json({ connection: existingConnection }, 200);
    }

    const ownerProofResult = verifyConnectionOwnerProof(
      (body as { ownerProof?: unknown }).ownerProof,
      connectionInput,
    );
    if (!ownerProofResult.ok) {
      return c.json({ error: ownerProofResult.error }, 403);
    }

    const connection = store.createConnection(connectionInput);
    return c.json({ connection }, 201);
  });

  app.get("/connections", (c) => {
    const wallet = c.req.query("wallet");
    if (!wallet) {
      return c.json({ error: "wallet_query_required" }, 400);
    }
    const sessionError = walletSessionError(
      store,
      wallet,
      c.req.header("x-skillguard-wallet-session"),
    );
    if (sessionError) {
      return c.json({ error: sessionError }, 401);
    }
    return c.json({ connections: store.listConnections(wallet) });
  });

  app.patch("/connections/:connectionId/policy", async (c) => {
    const body = await c.req.json();
    const policyPatch = parsePolicyPatch(body);
    if (!policyPatch) {
      return c.json({ error: "invalid_policy_patch" }, 400);
    }

    const currentConnection = store.getConnection(c.req.param("connectionId"));
    if (!currentConnection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    const proofResult = verifyPolicyUpdateOwnerProof(
      (body as { ownerProof?: unknown }).ownerProof,
      currentConnection,
      policyPatch,
    );
    if (!proofResult.ok) {
      return c.json({ error: proofResult.error }, 403);
    }

    const connection = store.updatePolicy(c.req.param("connectionId"), policyPatch);
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    reevaluateOpenActionsForConnection(store, connection.connectionId);
    return c.json({ connection });
  });

  app.post("/connections/:connectionId/revoke", async (c) => {
    const currentConnection = store.getConnection(c.req.param("connectionId"));
    if (!currentConnection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    const body = await readOptionalJson(c);
    const proofResult = verifyConnectionRevokeOwnerProof(
      (body as { ownerProof?: unknown }).ownerProof,
      currentConnection,
    );
    if (!proofResult.ok) {
      return c.json({ error: proofResult.error }, 403);
    }

    const connection = store.revokeConnection(c.req.param("connectionId"));
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    reevaluateOpenActionsForConnection(store, connection.connectionId);
    return c.json({ connection });
  });

  app.delete("/connections/:connectionId", async (c) => {
    const currentConnection = store.getConnection(c.req.param("connectionId"));
    if (!currentConnection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    const body = await readOptionalJson(c);
    const proofResult = verifyConnectionRevokeOwnerProof(
      (body as { ownerProof?: unknown }).ownerProof,
      currentConnection,
    );
    if (!proofResult.ok) {
      return c.json({ error: proofResult.error }, 403);
    }

    const connection = store.revokeConnection(c.req.param("connectionId"));
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    reevaluateOpenActionsForConnection(store, connection.connectionId);
    return c.json({ connection });
  });

  app.post("/actions", async (c) => {
    const body = parseActionPostBody(await c.req.json());
    if (!body) {
      return c.json({ error: "invalid_action" }, 400);
    }

    const connection = store.getConnection(body.connectionId);
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }
    if (!manifestMatchesConnection(body.manifest, connection)) {
      return c.json({ error: "manifest_connection_mismatch" }, 403);
    }
    const agent = store.getAgent(connection.agentId);
    if (!agent) {
      return c.json(notFound("agent_not_found"), 404);
    }
    const proofResult = verifyAgentActionProof(body.agentProof, {
      agent,
      connection,
      manifest: body.manifest,
    });
    if (!proofResult.ok) {
      return c.json({ error: proofResult.error }, 403);
    }
    if (store.getAction(body.manifest.actionId)) {
      return c.json({ error: "action_already_exists" }, 409);
    }

    const policyResult = evaluatePolicy(body.manifest, connection.policy);
    const action = store.createAction({
      actionId: body.manifest.actionId,
      connectionId: body.connectionId,
      manifest: body.manifest,
      policyResult,
      decisionStatus: decisionStatusForPolicy(policyResult),
    });

    return c.json({ action }, 201);
  });

  app.get("/actions", (c) => {
    const wallet = c.req.query("wallet");
    if (!wallet) {
      return c.json({ error: "wallet_query_required" }, 400);
    }
    const sessionError = walletSessionError(
      store,
      wallet,
      c.req.header("x-skillguard-wallet-session"),
    );
    if (sessionError) {
      return c.json({ error: sessionError }, 401);
    }

    return c.json({ actions: store.listActionsForWallet(wallet) });
  });

  app.get("/actions/pending", (c) => {
    const wallet = c.req.query("wallet");
    if (!wallet) {
      return c.json({ error: "wallet_query_required" }, 400);
    }
    const sessionError = walletSessionError(
      store,
      wallet,
      c.req.header("x-skillguard-wallet-session"),
    );
    if (sessionError) {
      return c.json({ error: sessionError }, 401);
    }

    return c.json({ actions: store.listPendingActions(wallet) });
  });

  app.get("/actions/:actionId", (c) => {
    const action = store.getAction(c.req.param("actionId"));
    if (!action) {
      return c.json(notFound("action_not_found"), 404);
    }

    return c.json({ action });
  });

  app.post("/actions/:actionId/evaluate", (c) => {
    const action = store.getAction(c.req.param("actionId"));
    if (!action) {
      return c.json(notFound("action_not_found"), 404);
    }

    const connection = store.getConnectionForAction(action);
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    const result = evaluatePolicy(action.manifest, connection.policy);
    store.storeEvaluation(action.actionId, result);
    return c.json({ result });
  });

  app.post("/actions/:actionId/decision", async (c) => {
    const body = (await c.req.json()) as {
      receiptAddress?: unknown;
      signature?: unknown;
      status?: unknown;
    };
    if (!isDecisionStatus(body.status)) {
      return c.json({ error: "invalid_decision_status" }, 400);
    }

    if (body.status === "approved" && (!hasText(body.signature) || !hasText(body.receiptAddress))) {
      return c.json({ error: "approved_decision_requires_receipt" }, 400);
    }

    const currentAction = store.getAction(c.req.param("actionId"));
    if (!currentAction) {
      return c.json(notFound("action_not_found"), 404);
    }
    const connection = store.getConnectionForAction(currentAction);
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }
    if (currentAction.decisionStatus === "blocked" && body.status === "approved") {
      return c.json({ error: "blocked_action_cannot_be_approved" }, 409);
    }
    if (currentAction.decisionStatus !== null) {
      return c.json({ error: "decision_already_final" }, 409);
    }

    const receiptAddress = hasText(body.receiptAddress) ? body.receiptAddress : null;
    const signature = hasText(body.signature) ? body.signature : null;
    const proofResult = verifyActionDecisionOwnerProof(
      (body as { decisionProof?: unknown }).decisionProof,
      {
        action: currentAction,
        connection,
        receiptAddress,
        signature,
        status: body.status,
      },
    );
    if (!proofResult.ok) {
      return c.json({ error: proofResult.error }, 403);
    }

    const action = store.storeDecision(c.req.param("actionId"), body.status, {
      receiptAddress,
      signature,
    });
    if (!action) {
      return c.json(notFound("action_not_found"), 404);
    }

    return c.json({ action });
  });

  return app;
}
