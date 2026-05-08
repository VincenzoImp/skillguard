import { describe, expect, test } from "vitest";

import { createApp } from "./routes.js";
import { createSeededStore } from "./seed.js";

function createTestApp() {
  return createApp(createSeededStore());
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

describe("SkillGuard API", () => {
  test("health returns ok", async () => {
    const response = await createTestApp().request("/health");

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ ok: true, service: "skillguard-api" });
  });

  test("seeded agent appears", async () => {
    const response = await createTestApp().request("/agents");
    const body = await json<{ agents: Array<{ agentId: string; name: string }> }>(response);

    expect(response.status).toBe(200);
    expect(body.agents).toEqual([
      expect.objectContaining({
        agentId: "agent-research",
        name: "Research Agent",
      }),
    ]);
  });

  test("unsafe action evaluates fail", async () => {
    const response = await createTestApp().request("/actions/action-unsafe-overspend/evaluate", {
      method: "POST",
    });
    const body = await json<{ result: { status: string; reasons: string[] } }>(response);

    expect(response.status).toBe(200);
    expect(body.result.status).toBe("fail");
    expect(body.result.reasons).toContain("spend_exceeds_max");
  });

  test("safe action evaluates requires_approval", async () => {
    const response = await createTestApp().request("/actions/action-safe-risk-report/evaluate", {
      method: "POST",
    });
    const body = await json<{ result: { status: string; reasons: string[] } }>(response);

    expect(response.status).toBe(200);
    expect(body.result.status).toBe("requires_approval");
    expect(body.result.reasons).toContain("policy_requires_manual_approval");
  });

  test("revoke blocks future action", async () => {
    const app = createTestApp();

    const revokeResponse = await app.request("/connections/conn-demo/revoke", { method: "POST" });
    expect(revokeResponse.status).toBe(200);

    const response = await app.request("/actions/action-safe-risk-report/evaluate", {
      method: "POST",
    });
    const body = await json<{ result: { status: string; reasons: string[] } }>(response);

    expect(body.result.status).toBe("fail");
    expect(body.result.reasons).toContain("policy_revoked");
  });

  test("decision endpoint stores approved status", async () => {
    const app = createTestApp();

    const response = await app.request("/actions/action-safe-risk-report/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    const body = await json<{ action: { actionId: string; decisionStatus: string } }>(response);

    expect(response.status).toBe(200);
    expect(body.action).toMatchObject({
      actionId: "action-safe-risk-report",
      decisionStatus: "approved",
    });
  });
});
