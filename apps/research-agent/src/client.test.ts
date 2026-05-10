import { describe, expect, it } from "vitest";
import type { ActionManifest } from "@skillguard/protocol";
import { safeRiskReportManifest } from "@skillguard/protocol";
import { createSkillGuardClient, publicKeyForKeyPair, smokeAgentKeyPair } from "./client.js";

describe("demo agent client", () => {
  it("can import the demo agent connection when an automation flow explicitly asks for it", async () => {
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
      agentKeyPair: smokeAgentKeyPair(),
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-SmokeWallet111",
      fetch,
    });

    await client.ensureAgentConnection("SmokeWallet111");

    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([
      "POST http://localhost:8787/agents",
      "POST http://localhost:8787/connections",
    ]);
    expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({
      agentId: "agent-research",
      name: "Demo Agent",
      publicKey: publicKeyForKeyPair(smokeAgentKeyPair()),
    });
    expect(JSON.parse(calls[1]?.body ?? "{}")).toMatchObject({
      agentId: "agent-research",
      connectionId: "conn-agent-research-SmokeWallet111",
      userWallet: "SmokeWallet111",
    });
  });

  it("supports a custom agent identity for live demo rotations", async () => {
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
      agent: {
        agentId: "agent-research-live",
        description: "Live QR-paired demo agent.",
        name: "Demo Agent Live",
      },
      agentKeyPair: smokeAgentKeyPair(),
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-live-Wallet111",
      fetch,
    });

    await client.ensureAgentConnection("Wallet111");

    expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({
      agentId: "agent-research-live",
      description: "Live QR-paired demo agent.",
      name: "Demo Agent Live",
      publicKey: publicKeyForKeyPair(smokeAgentKeyPair()),
    });
    expect(JSON.parse(calls[1]?.body ?? "{}")).toMatchObject({
      agentId: "agent-research-live",
      connectionId: "conn-agent-research-live-Wallet111",
      policy: {
        agentId: "agent-research-live",
        policyId: "policy-agent-research-live-Wallet111",
      },
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
      agentKeyPair: smokeAgentKeyPair(),
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
    expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({
      agentProof: {
        agentId: "agent-research",
        type: "ed25519-action",
      },
      connectionId: "conn-agent-research-Wallet111",
    });
  });

  it("signs actions with the configured custom agent id", async () => {
    const calls: Array<{ body?: string; url: string }> = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push({
        body: typeof init?.body === "string" ? init.body : undefined,
        url: url.toString(),
      });

      if (url.toString().endsWith("/actions")) {
        return jsonResponse({ action: { actionId: "action-custom-1" } });
      }

      return jsonResponse({ result: { reasons: [], status: "requires_approval" } });
    };
    const manifest = {
      ...safeRiskReportManifest,
      actionId: "action-custom-1",
      agentId: "agent-research-live",
    } as ActionManifest;

    const client = createSkillGuardClient({
      agent: {
        agentId: "agent-research-live",
        description: "Live QR-paired demo agent.",
        name: "Demo Agent Live",
      },
      agentKeyPair: smokeAgentKeyPair(),
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-live-Wallet111",
      fetch,
    });

    await client.submitAction(manifest);

    expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({
      agentProof: {
        agentId: "agent-research-live",
        type: "ed25519-action",
      },
      connectionId: "conn-agent-research-live-Wallet111",
      manifest: {
        agentId: "agent-research-live",
      },
    });
  });

  it("revokes the connection before the revoked research path submits", async () => {
    const calls: string[] = [];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url.toString()}`);
      return jsonResponse({ connection: { connectionId: "conn-agent-research-Wallet111" } });
    };

    const client = createSkillGuardClient({
      agentKeyPair: smokeAgentKeyPair(),
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch,
    });
    await client.revokeConnection();

    expect(calls).toEqual([
      "POST http://localhost:8787/connections/conn-agent-research-Wallet111/revoke",
    ]);
  });

  it("waits until an action reaches a terminal decision", async () => {
    const calls: string[] = [];
    const statuses = [null, "approved"];
    const fetch = async (url: string | URL, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${url.toString()}`);
      return jsonResponse({
        action: {
          actionId: "action-loop-1",
          decisionStatus: statuses.shift(),
        },
      });
    };

    const client = createSkillGuardClient({
      agentKeyPair: smokeAgentKeyPair(),
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch,
    });

    const result = await client.waitForDecision("action-loop-1", {
      pollMs: 1,
      sleep: async () => undefined,
      timeoutMs: 100,
    });

    expect(result.status).toBe("approved");
    expect(result.action?.actionId).toBe("action-loop-1");
    expect(calls).toEqual([
      "GET http://localhost:8787/actions/action-loop-1",
      "GET http://localhost:8787/actions/action-loop-1",
    ]);
  });

  it("returns timeout when an action never reaches a terminal decision", async () => {
    const client = createSkillGuardClient({
      agentKeyPair: smokeAgentKeyPair(),
      apiUrl: "http://localhost:8787",
      connectionId: "conn-agent-research-Wallet111",
      fetch: async () =>
        jsonResponse({
          action: {
            actionId: "action-loop-timeout",
            decisionStatus: null,
          },
        }),
    });

    const result = await client.waitForDecision("action-loop-timeout", {
      now: (() => {
        let current = 0;
        return () => {
          current += 60;
          return current;
        };
      })(),
      pollMs: 1,
      sleep: async () => undefined,
      timeoutMs: 100,
    });

    expect(result.status).toBe("timeout");
  });
});

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
