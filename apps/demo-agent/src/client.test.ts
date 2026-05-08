import { describe, expect, it } from "vitest";
import type { ActionManifest } from "@skillguard/protocol";
import { safeRiskReportManifest } from "@skillguard/protocol";
import { createSkillGuardClient } from "./client.js";

describe("demo agent client", () => {
  it("posts an action manifest and asks the API to evaluate it", async () => {
    const calls: Array<{ body?: string; method?: string; url: string }> = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push({
        body: typeof init?.body === "string" ? init.body : undefined,
        method: init?.method,
        url: url.toString(),
      });

      if (url.toString().endsWith("/actions")) {
        return jsonResponse({ action: { actionId: "action-demo-safe-run-1" } });
      }

      return jsonResponse({ result: { reasons: [], status: "requires_approval" } });
    };

    const client = createSkillGuardClient({
      apiUrl: "http://localhost:8787",
      connectionId: "conn-demo",
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

  it("revokes the connection before the revoked demo path submits", async () => {
    const calls: string[] = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url.toString()}`);
      return jsonResponse({ connection: { connectionId: "conn-demo" } });
    };

    const client = createSkillGuardClient({
      apiUrl: "http://localhost:8787",
      connectionId: "conn-demo",
      fetch,
    });
    await client.revokeConnection();

    expect(calls).toEqual([
      "POST http://localhost:8787/connections/conn-demo/revoke",
    ]);
  });
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
