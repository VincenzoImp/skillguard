import { describe, expect, it } from "vitest";
import { safeRiskReportManifest } from "@skillguard/protocol";
import { createSkillGuardClient } from "./index.js";

describe("SkillGuard SDK", () => {
  it("submits an action manifest with agent authentication headers", async () => {
    const calls: Array<{ body?: string; headers?: HeadersInit; url: string }> = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push({
        body: typeof init?.body === "string" ? init.body : undefined,
        headers: init?.headers,
        url: url.toString(),
      });
      return jsonResponse({ action: { actionId: safeRiskReportManifest.actionId } });
    };

    const client = createSkillGuardClient({
      agentId: "agent-research",
      agentSecret: "secret-demo",
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch,
    });
    const action = await client.submitAction(safeRiskReportManifest);

    expect(action.actionId).toBe(safeRiskReportManifest.actionId);
    expect(calls[0]?.url).toBe("http://localhost:8787/actions");
    expect(calls[0]?.headers).toEqual({
      authorization: "Bearer secret-demo",
      "content-type": "application/json",
      "x-skillguard-agent": "agent-research",
    });
  });

  it("reads the current decision status for an action", async () => {
    const fetch = async () =>
      jsonResponse({
        action: {
          actionId: safeRiskReportManifest.actionId,
          decisionStatus: "approved",
        },
      });
    const client = createSkillGuardClient({
      agentId: "agent-research",
      apiUrl: "http://localhost:8787",
      fetch,
    });

    await expect(client.onDecision(safeRiskReportManifest.actionId)).resolves.toBe(
      "approved"
    );
  });

  it("requires an explicit connection id before submitting wallet actions", async () => {
    let called = false;
    const fetch = async () => {
      called = true;
      return jsonResponse({ action: { actionId: safeRiskReportManifest.actionId } });
    };
    const client = createSkillGuardClient({
      agentId: "agent-research",
      apiUrl: "http://localhost:8787",
      fetch,
    });

    await expect(client.submitAction(safeRiskReportManifest)).rejects.toThrow(
      "connection_id_required"
    );
    expect(called).toBe(false);
  });
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
