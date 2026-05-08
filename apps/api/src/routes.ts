import type { ActionManifest, AgentPolicy, DecisionStatus } from "@skillguard/protocol";
import { evaluatePolicy } from "@skillguard/protocol";
import { Hono } from "hono";

import type { SkillGuardStore } from "./store.js";

function notFound(message: string) {
  return { error: message };
}

function isDecisionStatus(value: unknown): value is DecisionStatus {
  return (
    value === "approved" || value === "rejected" || value === "blocked" || value === "expired"
  );
}

export function createApp(store: SkillGuardStore): Hono {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true, service: "skillguard-api" }));

  app.get("/agents", (c) => c.json({ agents: store.listAgents() }));

  app.get("/agents/:agentId", (c) => {
    const agent = store.getAgent(c.req.param("agentId"));
    if (!agent) {
      return c.json(notFound("agent_not_found"), 404);
    }

    return c.json({ agent });
  });

  app.post("/connections", async (c) => {
    const body = (await c.req.json()) as {
      connectionId: string;
      agentId: string;
      userWallet: string;
      policy: AgentPolicy;
    };

    const connection = store.createConnection(body);
    return c.json({ connection }, 201);
  });

  app.patch("/connections/:connectionId/policy", async (c) => {
    const policyPatch = (await c.req.json()) as Partial<AgentPolicy>;
    const connection = store.updatePolicy(c.req.param("connectionId"), policyPatch);
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    return c.json({ connection });
  });

  app.post("/connections/:connectionId/revoke", (c) => {
    const connection = store.revokeConnection(c.req.param("connectionId"));
    if (!connection) {
      return c.json(notFound("connection_not_found"), 404);
    }

    return c.json({ connection });
  });

  app.post("/actions", async (c) => {
    const body = (await c.req.json()) as {
      connectionId: string;
      manifest: ActionManifest;
    };

    const action = store.createAction({
      actionId: body.manifest.actionId,
      connectionId: body.connectionId,
      manifest: body.manifest,
      policyResult: null,
      decisionStatus: null,
    });

    return c.json({ action }, 201);
  });

  app.get("/actions/pending", (c) => {
    const wallet = c.req.query("wallet");
    if (!wallet) {
      return c.json({ error: "wallet_query_required" }, 400);
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
    const body = (await c.req.json()) as { status?: unknown };
    if (!isDecisionStatus(body.status)) {
      return c.json({ error: "invalid_decision_status" }, 400);
    }

    const action = store.storeDecision(c.req.param("actionId"), body.status);
    if (!action) {
      return c.json(notFound("action_not_found"), 404);
    }

    return c.json({ action });
  });

  return app;
}
