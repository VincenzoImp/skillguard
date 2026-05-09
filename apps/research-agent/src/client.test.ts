import { describe, expect, it } from "vitest";
import type { ActionManifest } from "@skillguard/protocol";
import { safeRiskReportManifest } from "@skillguard/protocol";
import { createSkillGuardClient } from "./client.js";

describe("research agent client", () => {
  it("can import the research agent connection when an automation flow explicitly asks for it", async () => {
    const calls: Array<{ body?: string; method?: string; url: string }> = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push({
        body: typeof init?.body === "string" ? init.body : undefined,
        method: init?.method,
        url: url.toString(),
      });
      return jsonResponse({ ok: true });
    };

    const client = createSkillGuardClient({
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch,
    });

    await client.ensureAgentConnection("Wallet111");

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST http://localhost:8787/agents",
      "POST http://localhost:8787/connections",
    ]);
    expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({
      agentId: "agent-research",
      name: "Research Agent",
    });
    expect(JSON.parse(calls[1]?.body ?? "{}")).toMatchObject({
      agentId: "agent-research",
      connectionId: "conn-agent-research-Wallet111",
      userWallet: "Wallet111",
    });
  });

  it("posts an action manifest and asks the API to evaluate it", async () => {
    const calls: Array<{ body?: string; method?: string; url: string }> = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push({
        body: typeof init?.body === "string" ? init.body : undefined,
        method: init?.method,
        url: url.toString(),
      });

      if (url.toString().endsWith("/actions")) {
        return jsonResponse({ action: { actionId: "action-research-safe-run-1" } });
      }

      return jsonResponse({ result: { reasons: [], status: "requires_approval" } });
    };

    const client = createSkillGuardClient({
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch,
    });
    const response = await client.submitAction(
      safeRiskReportManifest as ActionManifest
    );

    expect(response.result.status).toBe("requires_approval");
    expect(calls.map((call) => call.url)).toEqual([
      "http://localhost:8787/actions",
      `http://localhost:8787/actions/${safeRiskReportManifest.actionId}/evaluate`,
    ]);
  });

  it("revokes the connection before the revoked research path submits", async () => {
    const calls: string[] = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url.toString()}`);
      return jsonResponse({ connection: { connectionId: "conn-agent-research-Wallet111" } });
    };

    const client = createSkillGuardClient({
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch,
    });
    await client.revokeConnection();

    expect(calls).toEqual([
      "POST http://localhost:8787/connections/conn-agent-research-Wallet111/revoke",
    ]);
  });
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
