import type { AgentPolicy } from "@skillguard/protocol";
import { describe, expect, it, vi } from "vitest";

import {
  buildConnectionOwnerMessage,
  buildDefaultPolicy,
  buildWalletSessionOwnerMessage,
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
    const signOwnerMessage = vi.fn(async () => new Uint8Array([1, 2, 3, 4]));

    const connection = await client.connectAgent(
      userWallet,
      {
        agentId: "agent-payments",
        description: "Payment automation agent.",
        name: "Payments Agent",
        publicKey: "AgentPublicKey111",
      },
      {
        allowedMints: ["USDC"],
        allowedNetworks: ["solana-devnet"],
        allowedProtocols: ["helius"],
        dailySpendCapAtomic: "2500000",
        maxSpendAtomic: "500000",
        mode: "allow_under_limits",
      },
      signOwnerMessage
    );

    const connectionRequest = requests[1]?.body as {
      ownerProof: { message: string; signatureBase64: string; type: string; wallet: string };
      policy: AgentPolicy;
    };
    expect(connection.connectionId).toBe(connectionIdForWallet(userWallet, "agent-payments"));
    expect(connection.agentId).toBe("agent-payments");
    expect(connection.policy).toMatchObject({
      agentId: "agent-payments",
      allowedMints: ["USDC"],
      allowedProtocols: ["helius"],
      dailySpendCapAtomic: "2500000",
      maxSpendAtomic: "500000",
      mode: "allow_under_limits",
      policyId: `policy-agent-payments-${userWallet}`,
      userWallet,
    });
    expect(requests[0]?.body).toEqual({
      agentId: "agent-payments",
      description: "Payment automation agent.",
      name: "Payments Agent",
      publicKey: "AgentPublicKey111",
    });
    expect(connectionRequest.ownerProof).toMatchObject({
      signatureBase64: "AQIDBA==",
      type: "solana-sign-message",
      wallet: userWallet,
    });
    const signedAt = Number(connectionRequest.ownerProof.message.split("signedAt:").at(-1));
    expect(Number.isSafeInteger(signedAt)).toBe(true);
    expect(connectionRequest.ownerProof.message).toBe(
      buildConnectionOwnerMessage({
        agentId: "agent-payments",
        connectionId: connectionIdForWallet(userWallet, "agent-payments"),
        policy: connectionRequest.policy,
        signedAt,
        userWallet,
      })
    );
    expect(signOwnerMessage).toHaveBeenCalledWith(
      new TextEncoder().encode(connectionRequest.ownerProof.message)
    );
  });

  it("loads connections and wallet actions without using seeded local state", async () => {
    const policy = buildDefaultPolicy(userWallet, "agent-research");
    const requests: Array<{ headers?: HeadersInit; url: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      requests.push({ headers: init?.headers, url });
      if (url.includes("/connections?")) {
        return response({
          connections: [
            {
              agentId: "agent-research",
              connectionId: connectionIdForWallet(userWallet, "agent-research"),
              policy,
              userWallet,
            },
          ],
        });
      }

      if (url.endsWith("/agents")) {
        return response({
          agents: [
            {
              agentId: "agent-research",
              description: "Solana demo agent.",
              name: "Demo Agent",
            },
          ],
        });
      }

      return response({
        actions: [
          {
            actionId: "action-live",
            connectionId: connectionIdForWallet(userWallet, "agent-research"),
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

    const state = await client.loadWalletState(userWallet, "sgw_live_session_token");

    expect(state.agent?.status).toBe("active");
    expect(state.agent?.name).toBe("Demo Agent");
    expect(state.agents.map((agent) => agent.id)).toEqual(["agent-research"]);
    expect(state.selectedActionId).toBe("action-live");
    expect(state.actions[0]).toMatchObject({
      id: "action-live",
      manifestHash: "hash-live",
      risk: "warning",
      spend: "0 USDC",
      status: "pending",
    });
    expect(requests[0]?.headers).toMatchObject({
      "x-skillguard-wallet-session": "sgw_live_session_token",
    });
    expect(requests[1]?.headers).toMatchObject({
      "x-skillguard-wallet-session": "sgw_live_session_token",
    });
  });

  it("creates a wallet session with an owner signature", async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) =>
      response({
        session: {
          expiresAt: 1_800_043_200,
          token: "sgw_session_token",
        },
        body: init?.body ? JSON.parse(String(init.body)) : null,
      }, 201)
    );
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);
    const signOwnerMessage = vi.fn(async () => new Uint8Array([9, 10, 11, 12]));

    const session = await client.createWalletSession(userWallet, signOwnerMessage);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      ownerProof: { message: string; signatureBase64: string; type: string; wallet: string };
      wallet: string;
    };
    const signedAt = Number(requestBody.ownerProof.message.split("signedAt:").at(-1));

    expect(session.token).toBe("sgw_session_token");
    expect(requestBody).toMatchObject({
      ownerProof: {
        signatureBase64: "CQoLDA==",
        type: "solana-sign-message",
        wallet: userWallet,
      },
      wallet: userWallet,
    });
    expect(requestBody.ownerProof.message).toBe(
      buildWalletSessionOwnerMessage({ signedAt, userWallet })
    );
  });

  it("registers and removes an Expo push token with the wallet session header", async () => {
    const calls: Array<{ body: unknown; headers?: HeadersInit; method: string; url: string }> = [];
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({
        body: init?.body ? JSON.parse(String(init.body)) : null,
        headers: init?.headers,
        method: init?.method ?? "GET",
        url,
      });
      return response({ pushTokens: ["ExponentPushToken[token-1]"] }, 201);
    });
    const client = createSkillGuardApiClient("https://api.skillguard.test", fetchMock);

    await client.registerPushToken(
      userWallet,
      "sgw_live_session_token",
      "ExponentPushToken[token-1]"
    );
    await client.removePushToken(
      userWallet,
      "sgw_live_session_token",
      "ExponentPushToken[token-1]"
    );

    expect(calls).toMatchObject([
      {
        body: { token: "ExponentPushToken[token-1]" },
        headers: {
          "content-type": "application/json",
          "x-skillguard-wallet-session": "sgw_live_session_token",
        },
        method: "POST",
        url: `https://api.skillguard.test/wallets/${userWallet}/push-token`,
      },
      {
        body: { token: "ExponentPushToken[token-1]" },
        headers: {
          "content-type": "application/json",
          "x-skillguard-wallet-session": "sgw_live_session_token",
        },
        method: "DELETE",
        url: `https://api.skillguard.test/wallets/${userWallet}/push-token`,
      },
    ]);
  });

  it("records approved decisions only with wallet proof, transaction signature, and receipt address", async () => {
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
    const signOwnerMessage = vi.fn(async () => new Uint8Array([1, 2, 3, 4]));

    await client.approveAction(
      "action-live",
      connectionIdForWallet(userWallet, "agent-research"),
      "5hRsignature",
      "Receipt111",
      userWallet,
      signOwnerMessage
    );

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      decisionProof: {
        signatureBase64: "AQIDBA==",
        type: "solana-sign-message",
        wallet: userWallet,
      },
      receiptAddress: "Receipt111",
      signature: "5hRsignature",
      status: "approved",
    });
    expect(signOwnerMessage).toHaveBeenCalledOnce();
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
    const policy: AgentPolicy = buildDefaultPolicy(userWallet, "agent-research");
    const signOwnerMessage = vi.fn(async () => new Uint8Array([5, 6, 7, 8]));

    await client.rejectAction(
      "action-live",
      connectionIdForWallet(userWallet, "agent-research"),
      userWallet,
      signOwnerMessage
    );
    await client.revokeConnection(
      connectionIdForWallet(userWallet, "agent-research"),
      userWallet,
      signOwnerMessage
    );
    await client.updatePolicyMode(
      connectionIdForWallet(userWallet, "agent-research"),
      policy,
      "block",
      userWallet,
      signOwnerMessage
    );

    expect(calls).toMatchObject([
      {
        body: { status: "rejected" },
        method: "POST",
        url: "https://api.skillguard.test/actions/action-live/decision",
      },
      {
        body: {
          ownerProof: {
            signatureBase64: "BQYHCA==",
            type: "solana-sign-message",
            wallet: userWallet,
          },
        },
        method: "POST",
        url: `https://api.skillguard.test/connections/${connectionIdForWallet(
          userWallet,
          "agent-research"
        )}/revoke`,
      },
      {
        body: { policyPatch: { mode: "block" } },
        method: "PATCH",
        url: `https://api.skillguard.test/connections/${connectionIdForWallet(
          userWallet,
          "agent-research"
        )}/policy`,
      },
    ]);
    expect((calls[0]?.body as { decisionProof?: unknown }).decisionProof).toMatchObject({
      signatureBase64: "BQYHCA==",
      type: "solana-sign-message",
      wallet: userWallet,
    });
  });
});
