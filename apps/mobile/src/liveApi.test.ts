import type { AgentPolicy } from "@skillguard/protocol";
import { describe, expect, it, vi } from "vitest";

import {
  buildDefaultPolicy,
  connectionIdForWallet,
  createSkillGuardApiClient,
} from "./liveApi";

const userWallet = "Wallet111111111111111111111111111111111111";

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("mobile live API client", () => {
  it("defaults production builds to the hosted SkillGuard API", async () => {
    const { DEFAULT_SKILLGUARD_API_URL } = await import("./liveApi");

    expect(DEFAULT_SKILLGUARD_API_URL).toBe("https://skillguard-sol.vercel.app/api");
  });

  it("creates a deterministic live agent connection for the connected wallet", async () => {
    const requests: Array<{ body: unknown; method: string; url: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url,
      });

      if (url.endsWith("/agents")) {
        return response({ agent: requests.at(-1)?.body });
      }

      return response({ connection: requests.at(-1)?.body }, 201);
    });
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);

    const connection = await client.ensureAgentConnection(userWallet);

    expect(connection.connectionId).toBe(connectionIdForWallet(userWallet));
    expect(connection.policy.userWallet).toBe(userWallet);
    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ["POST", "https://api.skillguard.test/agents"],
      ["POST", "https://api.skillguard.test/connections"],
    ]);
  });

  it("connects an arbitrary agent instead of only the built-in demo agent", async () => {
    const requests: Array<{ body: unknown; method: string; url: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url,
      });

      if (url.endsWith("/agents")) {
        return response({ agent: requests.at(-1)?.body });
      }

      return response({ connection: requests.at(-1)?.body }, 201);
    });
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);

    const connection = await client.connectAgent(userWallet, {
      agentId: "agent-payments",
      description: "Payment automation agent.",
      name: "Payments Agent",
    });

    expect(connection.connectionId).toBe(connectionIdForWallet(userWallet, "agent-payments"));
    expect(connection.agentId).toBe("agent-payments");
    expect(connection.policy).toMatchObject({
      agentId: "agent-payments",
      policyId: `policy-agent-payments-${userWallet}`,
      userWallet,
    });
    expect(requests[0]?.body).toEqual({
      agentId: "agent-payments",
      description: "Payment automation agent.",
      name: "Payments Agent",
    });
  });

  it("loads connections and wallet actions without using seeded local state", async () => {
    const policy = buildDefaultPolicy(userWallet);
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/connections?")) {
        return response({
          connections: [
            {
              agentId: "agent-research",
              connectionId: connectionIdForWallet(userWallet),
              policy,
              userWallet,
            },
          ],
        });
      }

      return response({
        actions: [
          {
            actionId: "action-live",
            connectionId: connectionIdForWallet(userWallet),
            decisionStatus: null,
            manifest: {
              accountsTouched: [userWallet],
              actionId: "action-live",
              agentId: "agent-research",
              createdAt: 1_800_000_000,
              expiresAt: 4_100_000_000,
              kind: "wallet_risk_report",
              network: "solana-devnet",
              protocols: ["helius"],
              rawTransactionRef: null,
              riskSignals: [
                {
                  code: "read_only",
                  level: "low",
                  message: "No token transfer is requested.",
                },
              ],
              schemaVersion: "skillguard.action.v1",
              spend: [
                {
                  amountAtomic: "0",
                  human: "0 USDC",
                  mint: "USDC",
                  reason: "Read-only report",
                },
              ],
              summary: "Analyze wallet risk.",
              title: "Generate wallet risk report",
              userWallet,
            },
            policyResult: {
              manifestHash: "hash-live",
              reasons: ["policy_requires_manual_approval"],
              riskLevel: "medium",
              status: "requires_approval",
            },
          },
        ],
      });
    });
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);

    const state = await client.loadWalletState(userWallet);

    expect(state.agent?.status).toBe("active");
    expect(state.agents.map((agent) => agent.id)).toEqual(["agent-research"]);
    expect(state.selectedActionId).toBe("action-live");
    expect(state.actions[0]).toMatchObject({
      id: "action-live",
      manifestHash: "hash-live",
      risk: "warning",
      spend: "0 USDC",
      status: "pending",
    });
  });

  it("records approved decisions only with transaction signature and receipt address", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      response({
        action: {
          actionId: "action-live",
          decisionReceiptAddress: "Receipt111",
          decisionSignature: "5hRsignature",
          decisionStatus: "approved",
        },
        body: init?.body ? JSON.parse(String(init.body)) : null,
      })
    );
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);

    await client.approveAction("action-live", "5hRsignature", "Receipt111");

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      receiptAddress: "Receipt111",
      signature: "5hRsignature",
      status: "approved",
    });
  });

  it("rejects, revokes, and updates policy mode through remote API calls", async () => {
    const calls: Array<{ body: unknown; method: string; url: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        method: init?.method ?? "GET",
        url,
      });
      return response({});
    });
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);
    const policy: AgentPolicy = buildDefaultPolicy(userWallet);

    await client.rejectAction("action-live");
    await client.revokeConnection(connectionIdForWallet(userWallet));
    await client.updatePolicyMode(connectionIdForWallet(userWallet), policy, "block");

    expect(calls).toEqual([
      {
        body: { status: "rejected" },
        method: "POST",
        url: "https://api.skillguard.test/actions/action-live/decision",
      },
      {
        body: null,
        method: "DELETE",
        url: `https://api.skillguard.test/connections/${connectionIdForWallet(userWallet)}`,
      },
      {
        body: { mode: "block" },
        method: "PATCH",
        url: `https://api.skillguard.test/connections/${connectionIdForWallet(
          userWallet
        )}/policy`,
      },
    ]);
  });
});
