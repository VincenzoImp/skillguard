import { describe, expect, test } from "vitest";
import bs58 from "bs58";
import nacl from "tweetnacl";
import type { ActionManifest, AgentPolicy } from "@skillguard/protocol";
import { buildAgentActionMessage, fixtureWallet } from "@skillguard/protocol";

import {
  buildActionDecisionOwnerMessage,
  buildConnectionOwnerMessage,
  buildConnectionRevokeOwnerMessage,
  buildPolicyUpdateOwnerMessage,
  buildWalletSessionOwnerMessage,
} from "./ownerProof.js";
import { createApp } from "./routes.js";
import { createSeededStore } from "./seed.js";
import { SkillGuardStore } from "./store.js";

function createTestApp() {
  return createApp(createSeededStore());
}

function createEmptyTestApp() {
  return createApp(new SkillGuardStore({ actions: [], agents: [], connections: [] }));
}

async function json<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function testKeyPair(seedByte: number): nacl.SignKeyPair {
  return nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(seedByte));
}

function walletFor(keyPair: nacl.SignKeyPair): string {
  return bs58.encode(keyPair.publicKey);
}

const SEEDED_WALLET_KEYPAIR = testKeyPair(1);
const SEEDED_AGENT_KEYPAIR = testKeyPair(2);
const SEEDED_WALLET = fixtureWallet;

function ownerProofFor({
  agentId,
  connectionId,
  keyPair,
  policy,
  signedAt = Date.now(),
  userWallet,
}: {
  agentId: string;
  connectionId: string;
  keyPair: nacl.SignKeyPair;
  policy: AgentPolicy;
  signedAt?: number;
  userWallet: string;
}) {
  const message = buildConnectionOwnerMessage({
    agentId,
    connectionId,
    policy,
    signedAt,
    userWallet,
  });
  return {
    message,
    signatureBase64: Buffer.from(
      nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey),
    ).toString("base64"),
    signedAt,
    type: "solana-sign-message",
    wallet: userWallet,
  };
}

function ownerProofForMessage(message: string, keyPair: nacl.SignKeyPair, userWallet: string) {
  return {
    message,
    signatureBase64: Buffer.from(
      nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey),
    ).toString("base64"),
    signedAt: Number(message.match(/^signedAt:(\d+)$/m)?.[1] ?? Date.now()),
    type: "solana-sign-message",
    wallet: userWallet,
  };
}

function agentProofFor({
  agentId,
  connectionId,
  keyPair,
  manifest,
  signedAt = Date.now(),
}: {
  agentId: string;
  connectionId: string;
  keyPair: nacl.SignKeyPair;
  manifest: ActionManifest;
  signedAt?: number;
}) {
  const message = buildAgentActionMessage({
    agentId,
    connectionId,
    manifest,
    signedAt,
  });
  return {
    agentId,
    message,
    signatureBase64: Buffer.from(
      nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey),
    ).toString("base64"),
    signedAt,
    type: "ed25519-action",
  };
}

function seededAgentProof(manifest: ActionManifest) {
  return agentProofFor({
    agentId: "agent-research",
    connectionId: "conn-seeded",
    keyPair: SEEDED_AGENT_KEYPAIR,
    manifest,
  });
}

function seededRevokeOwnerProof() {
  const signedAt = Date.now();
  return ownerProofForMessage(
    buildConnectionRevokeOwnerMessage({
      connectionId: "conn-seeded",
      signedAt,
      userWallet: SEEDED_WALLET,
    }),
    SEEDED_WALLET_KEYPAIR,
    SEEDED_WALLET,
  );
}

function seededDecisionOwnerProof({
  actionId = "action-safe-risk-report",
  receiptAddress = null,
  signature = null,
  status,
}: {
  actionId?: string;
  receiptAddress?: string | null;
  signature?: string | null;
  status: "approved" | "blocked" | "expired" | "rejected";
}) {
  const signedAt = Date.now();
  return ownerProofForMessage(
    buildActionDecisionOwnerMessage({
      actionId,
      connectionId: "conn-seeded",
      receiptAddress,
      signature,
      signedAt,
      status,
      userWallet: SEEDED_WALLET,
    }),
    SEEDED_WALLET_KEYPAIR,
    SEEDED_WALLET,
  );
}

function walletSessionProofFor({
  keyPair,
  signedAt = Date.now(),
  userWallet,
}: {
  keyPair: nacl.SignKeyPair;
  signedAt?: number;
  userWallet: string;
}) {
  return ownerProofForMessage(
    buildWalletSessionOwnerMessage({ signedAt, userWallet }),
    keyPair,
    userWallet,
  );
}

async function createWalletSession({
  app,
  wallet,
  walletKeyPair,
}: {
  app: ReturnType<typeof createEmptyTestApp>;
  wallet: string;
  walletKeyPair: nacl.SignKeyPair;
}): Promise<string> {
  const response = await app.request("/wallet-sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ownerProof: walletSessionProofFor({ keyPair: walletKeyPair, userWallet: wallet }),
      wallet,
    }),
  });
  const body = await json<{ session: { token: string } }>(response);
  expect(response.status).toBe(201);
  expect(body.session.token).toMatch(/^sgw_/);
  return body.session.token;
}

async function walletSessionHeaders({
  app,
  wallet,
  walletKeyPair,
}: {
  app: ReturnType<typeof createEmptyTestApp>;
  wallet: string;
  walletKeyPair: nacl.SignKeyPair;
}) {
  const token = await createWalletSession({ app, wallet, walletKeyPair });
  return { "x-skillguard-wallet-session": token };
}

async function createLiveConnection({
  agentKeyPair = testKeyPair(21),
  agentId = "agent-live",
  app = createEmptyTestApp(),
  connectionId = "conn-agent-live-wallet",
  walletKeyPair = testKeyPair(22),
}: {
  agentId?: string;
  agentKeyPair?: nacl.SignKeyPair;
  app?: ReturnType<typeof createEmptyTestApp>;
  connectionId?: string;
  walletKeyPair?: nacl.SignKeyPair;
} = {}) {
  const wallet = walletFor(walletKeyPair);
  const policy: AgentPolicy = {
    active: true,
    agentId,
    allowedMints: ["SOL", "USDC"],
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: ["helius", "birdeye"],
    dailySpendCapAtomic: "5000000",
    expiresAt: 4_100_000_000,
    maxSpendAtomic: "1000000",
    mode: "ask_every_time",
    policyId: `policy-${agentId}-${wallet}`,
    revoked: false,
    userWallet: wallet,
  };

  const agentResponse = await app.request("/agents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agentId,
      description: "Live agent used by security tests.",
      name: "Live Agent",
      publicKey: walletFor(agentKeyPair),
    }),
  });
  expect(agentResponse.status).toBe(201);

  const connectionResponse = await app.request("/connections", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      agentId,
      connectionId,
      ownerProof: ownerProofFor({ agentId, connectionId, keyPair: walletKeyPair, policy, userWallet: wallet }),
      policy,
      userWallet: wallet,
    }),
  });
  expect(connectionResponse.status).toBe(201);

  return {
    agentId,
    agentKeyPair,
    app,
    connectionId,
    policy,
    wallet,
    walletKeyPair,
  };
}

function liveManifest({
  actionId = "action-live-secure",
  agentId,
  wallet,
}: {
  actionId?: string;
  agentId: string;
  wallet: string;
}): ActionManifest {
  return {
    actionId,
    accountsTouched: [wallet],
    agentId,
    createdAt: 1_800_000_000,
    expiresAt: 4_100_000_000,
    kind: "wallet_risk_report",
    network: "solana-devnet",
    protocols: ["helius", "birdeye"],
    rawTransactionRef: null,
    riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
    schemaVersion: "skillguard.action.v1",
    spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
    summary: "Live secure request.",
    title: "Live secure request",
    userWallet: wallet,
  };
}

describe("SkillGuard API", () => {
  test("health returns ok", async () => {
    const response = await createTestApp().request("/health");

    expect(response.status).toBe(200);
    expect(await json(response)).toEqual({ ok: true, service: "skillguard-api" });
  });

  test("test fixture agent appears", async () => {
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

  test("agent registration refreshes metadata when the public key is unchanged", async () => {
    const app = createTestApp();

    const response = await app.request("/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-research",
        description: "Solana wallet risk agent that requests wallet-safe actions.",
        name: "Research Agent",
        publicKey: "9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu",
      }),
    });
    const body = await json<{ agent: { description: string } }>(response);

    expect(response.status).toBe(200);
    expect(body.agent.description).toBe(
      "Solana wallet risk agent that requests wallet-safe actions."
    );
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

    const revokeResponse = await app.request("/connections/conn-seeded/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerProof: seededRevokeOwnerProof() }),
    });
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
      body: JSON.stringify({
        decisionProof: seededDecisionOwnerProof({
          actionId: "action-safe-risk-report",
          receiptAddress: "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
          signature: "5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF",
          status: "approved",
        }),
        receiptAddress: "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
        signature: "5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF",
        status: "approved",
      }),
    });
    const body = await json<{ action: { actionId: string; decisionStatus: string } }>(response);

    expect(response.status).toBe(200);
    expect(body.action).toMatchObject({
      actionId: "action-safe-risk-report",
      decisionStatus: "approved",
    });
  });

  test("agent can be inserted, connected to a wallet, and listed by wallet", async () => {
    const app = createEmptyTestApp();
    const keyPair = testKeyPair(7);
    const wallet = walletFor(keyPair);
    const connectionId = "conn-agent-live-Dd6t";
    const policy: AgentPolicy = {
      active: true,
      agentId: "agent-live",
      allowedMints: ["SOL", "USDC"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "5000000",
      expiresAt: 4_100_000_000,
      maxSpendAtomic: "1000000",
      mode: "ask_every_time",
      policyId: "policy-agent-live-Dd6t",
      revoked: false,
      userWallet: wallet,
    };

    const agentResponse = await app.request("/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-live",
        description: "Live agent used by the hackathon flow.",
        name: "Live Agent",
        publicKey: walletFor(testKeyPair(8)),
      }),
    });
    expect(agentResponse.status).toBe(201);

    const connectionResponse = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-live",
        connectionId,
        ownerProof: ownerProofFor({ agentId: "agent-live", connectionId, keyPair, policy, userWallet: wallet }),
        policy,
        userWallet: wallet,
      }),
    });
    expect(connectionResponse.status).toBe(201);

    const listResponse = await app.request(`/connections?wallet=${wallet}`, {
      headers: await walletSessionHeaders({ app, wallet, walletKeyPair: keyPair }),
    });
    const body = await json<{
      connections: Array<{ agentId: string; connectionId: string; userWallet: string }>;
    }>(listResponse);

    expect(listResponse.status).toBe(200);
    expect(body.connections).toEqual([
      expect.objectContaining({
        agentId: "agent-live",
        connectionId,
        userWallet: wallet,
      }),
    ]);
  });

  test("wallet feeds require a wallet session and accept signed session tokens", async () => {
    const { app, wallet, walletKeyPair } = await createLiveConnection();

    const blockedConnections = await app.request(`/connections?wallet=${wallet}`);
    expect(blockedConnections.status).toBe(401);
    expect(await json<{ error: string }>(blockedConnections)).toEqual({
      error: "wallet_session_required",
    });

    const blockedActions = await app.request(`/actions?wallet=${wallet}`);
    expect(blockedActions.status).toBe(401);

    const headers = await walletSessionHeaders({ app, wallet, walletKeyPair });

    const connections = await app.request(`/connections?wallet=${wallet}`, { headers });
    const actions = await app.request(`/actions?wallet=${wallet}`, { headers });

    expect(connections.status).toBe(200);
    expect(actions.status).toBe(200);
  });

  test("push token registration requires a wallet session and can remove tokens", async () => {
    const walletKeyPair = testKeyPair(31);
    const wallet = walletFor(walletKeyPair);
    const store = new SkillGuardStore({ actions: [], agents: [], connections: [] });
    const app = createApp(store);
    const token = "ExponentPushToken[token-1]";

    const blocked = await app.request(`/wallets/${wallet}/push-token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    expect(blocked.status).toBe(401);

    const headers = await walletSessionHeaders({ app, wallet, walletKeyPair });
    const registered = await app.request(`/wallets/${wallet}/push-token`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });

    expect(registered.status).toBe(201);
    expect(store.listPushTokens(wallet)).toEqual([token]);

    const removed = await app.request(`/wallets/${wallet}/push-token`, {
      method: "DELETE",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });

    expect(removed.status).toBe(200);
    expect(store.listPushTokens(wallet)).toEqual([]);
  });

  test("connection creation rejects requests without wallet owner proof", async () => {
    const app = createEmptyTestApp();
    const wallet = "Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx";

    const agentResponse = await app.request("/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-live",
        description: "Live agent used by the hackathon flow.",
        name: "Live Agent",
        publicKey: walletFor(testKeyPair(8)),
      }),
    });
    expect(agentResponse.status).toBe(201);

    const connectionResponse = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-live",
        connectionId: "conn-agent-live-Dd6t",
        policy: {
          active: true,
          agentId: "agent-live",
          allowedMints: ["SOL", "USDC"],
          allowedNetworks: ["solana-devnet"],
          allowedProtocols: ["helius", "birdeye"],
          dailySpendCapAtomic: "5000000",
          expiresAt: 4_100_000_000,
          maxSpendAtomic: "1000000",
          mode: "ask_every_time",
          policyId: "policy-agent-live-Dd6t",
          revoked: false,
          userWallet: wallet,
        },
        userWallet: wallet,
      }),
    });
    const body = await json<{ error: string }>(connectionResponse);

    expect(connectionResponse.status).toBe(403);
    expect(body.error).toBe("wallet_owner_proof_required");
  });

  test("posted action is evaluated immediately and visible in wallet action feed", async () => {
    const app = createTestApp();

    const postResponse = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: seededAgentProof({
          actionId: "action-live-safe",
          accountsTouched: [SEEDED_WALLET],
          agentId: "agent-research",
          createdAt: 1_800_000_000,
          expiresAt: 4_100_000_000,
          kind: "wallet_risk_report",
          network: "solana-devnet",
          protocols: ["helius", "birdeye"],
          rawTransactionRef: null,
          riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
          schemaVersion: "skillguard.action.v1",
          spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
          summary: "Live safe request.",
          title: "Live safe request",
          userWallet: SEEDED_WALLET,
        }),
        connectionId: "conn-seeded",
        manifest: {
          actionId: "action-live-safe",
          accountsTouched: [SEEDED_WALLET],
          agentId: "agent-research",
          createdAt: 1_800_000_000,
          expiresAt: 4_100_000_000,
          kind: "wallet_risk_report",
          network: "solana-devnet",
          protocols: ["helius", "birdeye"],
          rawTransactionRef: null,
          riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
          schemaVersion: "skillguard.action.v1",
          spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
          summary: "Live safe request.",
          title: "Live safe request",
          userWallet: SEEDED_WALLET,
        },
      }),
    });
    const postBody = await json<{
      action: {
        actionId: string;
        decisionStatus: string | null;
        policyResult: { status: string; reasons: string[] };
      };
    }>(postResponse);

    expect(postResponse.status).toBe(201);
    expect(postBody.action.policyResult.status).toBe("requires_approval");
    expect(postBody.action.decisionStatus).toBeNull();

    const feedResponse = await app.request(`/actions?wallet=${SEEDED_WALLET}`, {
      headers: await walletSessionHeaders({
        app,
        wallet: SEEDED_WALLET,
        walletKeyPair: SEEDED_WALLET_KEYPAIR,
      }),
    });
    const feedBody = await json<{
      actions: Array<{ actionId: string; policyResult: { manifestHash: string } | null }>;
    }>(feedResponse);

    expect(feedResponse.status).toBe(200);
    expect(feedBody.actions.map((action) => action.actionId)).toContain("action-live-safe");
    expect(
      feedBody.actions.find((action) => action.actionId === "action-live-safe")?.policyResult
        ?.manifestHash,
    ).toMatch(/^[a-f0-9]{64}$/);
  });

  test("action creation pushes pending requests to registered wallet devices", async () => {
    const store = new SkillGuardStore({ actions: [], agents: [], connections: [] });
    const pushes: Array<{ body: string; data: Record<string, unknown>; title: string; tokens: string[] }> = [];
    const app = createApp(store, {
      pushNotifications: async ({ message, tokens }) => {
        pushes.push({ ...message, tokens });
        return { deadTokens: ["ExponentPushToken[dead]"], sent: 1 };
      },
    });
    const { agentId, agentKeyPair, connectionId, wallet } = await createLiveConnection({ app });
    store.addPushToken(wallet, "ExponentPushToken[live]");
    store.addPushToken(wallet, "ExponentPushToken[dead]");
    const manifest = liveManifest({ agentId, wallet });

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: agentProofFor({ agentId, connectionId, keyPair: agentKeyPair, manifest }),
        connectionId,
        manifest,
      }),
    });

    expect(response.status).toBe(201);
    expect(pushes).toEqual([
      {
        body: "Live secure request",
        data: { actionId: "action-live-secure", kind: "new_action" },
        title: "Live Agent",
        tokens: ["ExponentPushToken[live]", "ExponentPushToken[dead]"],
      },
    ]);
    expect(store.listPushTokens(wallet)).toEqual(["ExponentPushToken[live]"]);
  });

  test("action creation still succeeds when push delivery fails", async () => {
    const store = new SkillGuardStore({ actions: [], agents: [], connections: [] });
    const app = createApp(store, {
      pushNotifications: async () => {
        throw new Error("expo_unavailable");
      },
    });
    const { agentId, agentKeyPair, connectionId, wallet } = await createLiveConnection({ app });
    store.addPushToken(wallet, "ExponentPushToken[live]");
    const manifest = liveManifest({ actionId: "action-push-failure", agentId, wallet });

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: agentProofFor({ agentId, connectionId, keyPair: agentKeyPair, manifest }),
        connectionId,
        manifest,
      }),
    });
    const body = await json<{ action: { actionId: string } }>(response);

    expect(response.status).toBe(201);
    expect(body.action.actionId).toBe("action-push-failure");
  });

  test("action creation rejects requests without an agent signature proof", async () => {
    const { agentId, app, connectionId, wallet, walletKeyPair } = await createLiveConnection();
    const manifest = liveManifest({ agentId, wallet });

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connectionId,
        manifest,
      }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("agent_action_proof_required");
    expect(
      await json<{ actions: unknown[] }>(
        await app.request(`/actions?wallet=${wallet}`, {
          headers: await walletSessionHeaders({ app, wallet, walletKeyPair }),
        }),
      ),
    ).toEqual({ actions: [] });
  });

  test("action creation rejects agent signatures from a different key", async () => {
    const { agentId, app, connectionId, wallet } = await createLiveConnection();
    const manifest = liveManifest({ actionId: "action-live-attacker-proof", agentId, wallet });
    const attackerKeyPair = testKeyPair(23);

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: agentProofFor({ agentId, connectionId, keyPair: attackerKeyPair, manifest }),
        connectionId,
        manifest,
      }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("invalid_agent_action_proof");
  });

  test("policy updates require a wallet owner proof", async () => {
    const { app, connectionId } = await createLiveConnection();

    const response = await app.request(`/connections/${connectionId}/policy`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ policyPatch: { mode: "block" } }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("wallet_owner_proof_required");
  });

  test("connection revocation requires a wallet owner proof", async () => {
    const { app, connectionId } = await createLiveConnection();

    const response = await app.request(`/connections/${connectionId}/revoke`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("wallet_owner_proof_required");
  });

  test("manual decisions require a wallet owner proof", async () => {
    const { agentId, agentKeyPair, app, connectionId, wallet } = await createLiveConnection();
    const manifest = liveManifest({ actionId: "action-live-decision-proof", agentId, wallet });
    const postResponse = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: agentProofFor({ agentId, connectionId, keyPair: agentKeyPair, manifest }),
        connectionId,
        manifest,
      }),
    });
    expect(postResponse.status).toBe(201);

    const response = await app.request(`/actions/${manifest.actionId}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("wallet_owner_proof_required");
  });

  test("wallet owner can update policy, revoke, and reject with signed proofs", async () => {
    const { agentId, agentKeyPair, app, connectionId, policy, wallet, walletKeyPair } =
      await createLiveConnection();
    const policyPatch = { maxSpendAtomic: "2000000" };
    const patchSignedAt = Date.now();
    const policyMessage = buildPolicyUpdateOwnerMessage({
      connectionId,
      policyPatch,
      signedAt: patchSignedAt,
      userWallet: wallet,
    });

    const policyResponse = await app.request(`/connections/${connectionId}/policy`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerProof: ownerProofForMessage(policyMessage, walletKeyPair, wallet),
        policyPatch,
      }),
    });
    expect(policyResponse.status).toBe(200);

    const manifest = liveManifest({ actionId: "action-live-owner-decision", agentId, wallet });
    const actionResponse = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: agentProofFor({ agentId, connectionId, keyPair: agentKeyPair, manifest }),
        connectionId,
        manifest,
      }),
    });
    expect(actionResponse.status).toBe(201);

    const decisionSignedAt = Date.now();
    const decisionMessage = buildActionDecisionOwnerMessage({
      actionId: manifest.actionId,
      connectionId,
      receiptAddress: null,
      signature: null,
      signedAt: decisionSignedAt,
      status: "rejected",
      userWallet: wallet,
    });
    const decisionResponse = await app.request(`/actions/${manifest.actionId}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decisionProof: ownerProofForMessage(decisionMessage, walletKeyPair, wallet),
        status: "rejected",
      }),
    });
    expect(decisionResponse.status).toBe(200);

    const revokeSignedAt = Date.now();
    const revokeMessage = buildConnectionRevokeOwnerMessage({
      connectionId,
      signedAt: revokeSignedAt,
      userWallet: wallet,
    });
    const revokeResponse = await app.request(`/connections/${connectionId}/revoke`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerProof: ownerProofForMessage(revokeMessage, walletKeyPair, wallet),
      }),
    });
    const revokeBody = await json<{ connection: { policy: AgentPolicy } }>(revokeResponse);

    expect(revokeResponse.status).toBe(200);
    expect(revokeBody.connection.policy).toMatchObject({
      active: false,
      maxSpendAtomic: "2000000",
      policyId: policy.policyId,
      revoked: true,
    });
  });

  test("connection creation rejects missing fields instead of creating malformed records", async () => {
    const app = createTestApp();

    const response = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-research",
        userWallet: SEEDED_WALLET,
      }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(400);
    expect(body.error).toBe("invalid_connection");
  });

  test("action creation rejects manifests that do not match the connection wallet", async () => {
    const app = createTestApp();

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: seededAgentProof({
          actionId: "action-safe-risk-report",
          accountsTouched: [SEEDED_WALLET],
          agentId: "agent-research",
          createdAt: 1_800_000_000,
          expiresAt: 4_100_000_000,
          kind: "wallet_risk_report",
          network: "solana-devnet",
          protocols: ["helius", "birdeye"],
          rawTransactionRef: null,
          riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
          schemaVersion: "skillguard.action.v1",
          spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
          summary: "Duplicate safe request.",
          title: "Duplicate safe request",
          userWallet: SEEDED_WALLET,
        }),
        connectionId: "conn-seeded",
        manifest: {
          actionId: "action-wallet-mismatch",
          accountsTouched: ["AttackerWallet111111111111111111111111111111"],
          agentId: "agent-research",
          createdAt: 1_800_000_000,
          expiresAt: 4_100_000_000,
          kind: "wallet_risk_report",
          network: "solana-devnet",
          protocols: ["helius", "birdeye"],
          rawTransactionRef: null,
          riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
          schemaVersion: "skillguard.action.v1",
          spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
          summary: "Mismatched wallet request.",
          title: "Mismatched wallet request",
          userWallet: "AttackerWallet111111111111111111111111111111",
        },
      }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe("manifest_connection_mismatch");
    const attackerFeed = await app.request(
      "/actions?wallet=AttackerWallet111111111111111111111111111111",
    );
    expect(attackerFeed.status).toBe(401);
  });

  test("action creation rejects duplicate action ids instead of overwriting history", async () => {
    const app = createTestApp();

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentProof: seededAgentProof({
          actionId: "action-safe-risk-report",
          accountsTouched: [SEEDED_WALLET],
          agentId: "agent-research",
          createdAt: 1_800_000_000,
          expiresAt: 4_100_000_000,
          kind: "wallet_risk_report",
          network: "solana-devnet",
          protocols: ["helius", "birdeye"],
          rawTransactionRef: null,
          riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
          schemaVersion: "skillguard.action.v1",
          spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
          summary: "Duplicate safe request.",
          title: "Duplicate safe request",
          userWallet: SEEDED_WALLET,
        }),
        connectionId: "conn-seeded",
        manifest: {
          actionId: "action-safe-risk-report",
          accountsTouched: [SEEDED_WALLET],
          agentId: "agent-research",
          createdAt: 1_800_000_000,
          expiresAt: 4_100_000_000,
          kind: "wallet_risk_report",
          network: "solana-devnet",
          protocols: ["helius", "birdeye"],
          rawTransactionRef: null,
          riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
          schemaVersion: "skillguard.action.v1",
          spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
          summary: "Duplicate safe request.",
          title: "Duplicate safe request",
          userWallet: SEEDED_WALLET,
        },
      }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(409);
    expect(body.error).toBe("action_already_exists");
  });

  test("final decisions cannot be overwritten", async () => {
    const app = createTestApp();

    const rejectResponse = await app.request("/actions/action-safe-risk-report/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decisionProof: seededDecisionOwnerProof({ status: "rejected" }),
        status: "rejected",
      }),
    });
    expect(rejectResponse.status).toBe(200);

    const approveResponse = await app.request("/actions/action-safe-risk-report/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        receiptAddress: "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
        signature: "5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF",
        status: "approved",
      }),
    });
    const body = await json<{ error: string }>(approveResponse);

    expect(approveResponse.status).toBe(409);
    expect(body.error).toBe("decision_already_final");
  });

  test("connection upsert without owner proof does not reactivate a revoked agent", async () => {
    const app = createTestApp();

    const revokeResponse = await app.request("/connections/conn-seeded/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerProof: seededRevokeOwnerProof() }),
    });
    expect(revokeResponse.status).toBe(200);

    const reconnectResponse = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-research",
        connectionId: "conn-seeded",
        policy: {
          active: true,
          agentId: "agent-research",
          allowedMints: ["SOL", "USDC"],
          allowedNetworks: ["solana-devnet"],
          allowedProtocols: ["helius", "birdeye"],
          dailySpendCapAtomic: "5000000",
          expiresAt: 4_100_000_000,
          maxSpendAtomic: "1000000",
          mode: "ask_every_time",
          policyId: "policy-ask-every-time",
          revoked: false,
          userWallet: SEEDED_WALLET,
        },
        userWallet: SEEDED_WALLET,
      }),
    });
    const reconnectBody = await json<{ error: string }>(reconnectResponse);

    expect(reconnectResponse.status).toBe(403);
    expect(reconnectBody.error).toBe("wallet_owner_proof_required");
  });

  test("owner-signed connection upsert reactivates a revoked agent", async () => {
    const app = createTestApp();

    const revokeResponse = await app.request("/connections/conn-seeded/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerProof: seededRevokeOwnerProof() }),
    });
    expect(revokeResponse.status).toBe(200);

    const policy: AgentPolicy = {
      active: true,
      agentId: "agent-research",
      allowedMints: ["SOL"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "50000000",
      expiresAt: 4_100_000_000,
      maxSpendAtomic: "10000000",
      mode: "ask_every_time",
      policyId: "policy-reimported-agent",
      revoked: false,
      userWallet: SEEDED_WALLET,
    };

    const reconnectResponse = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-research",
        connectionId: "conn-seeded",
        ownerProof: ownerProofFor({
          agentId: "agent-research",
          connectionId: "conn-seeded",
          keyPair: SEEDED_WALLET_KEYPAIR,
          policy,
          userWallet: SEEDED_WALLET,
        }),
        policy,
        userWallet: SEEDED_WALLET,
      }),
    });
    const reconnectBody = await json<{
      connection: { policy: { active: boolean; maxSpendAtomic: string; policyId: string; revoked: boolean } };
    }>(reconnectResponse);

    expect(reconnectResponse.status).toBe(200);
    expect(reconnectBody.connection.policy).toMatchObject({
      active: true,
      maxSpendAtomic: "10000000",
      policyId: "policy-reimported-agent",
      revoked: false,
    });
  });

  test("connection id reuse is rejected when it targets a different wallet", async () => {
    const app = createTestApp();
    const response = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-research",
        connectionId: "conn-seeded",
        policy: {
          active: true,
          agentId: "agent-research",
          allowedMints: ["SOL", "USDC"],
          allowedNetworks: ["solana-devnet"],
          allowedProtocols: ["helius", "birdeye"],
          dailySpendCapAtomic: "5000000",
          expiresAt: 4_100_000_000,
          maxSpendAtomic: "1000000",
          mode: "ask_every_time",
          policyId: "policy-conflicting-wallet",
          revoked: false,
          userWallet: "DifferentWallet111111111111111111111111111111",
        },
        userWallet: "DifferentWallet111111111111111111111111111111",
      }),
    });
    const body = await json<{ error: string }>(response);

    expect(response.status).toBe(409);
    expect(body.error).toBe("connection_id_conflict");
  });

  test("revoking a connection blocks unresolved actions and removes approval ability", async () => {
    const app = createTestApp();

    const revokeResponse = await app.request("/connections/conn-seeded", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ownerProof: seededRevokeOwnerProof() }),
    });
    expect(revokeResponse.status).toBe(200);

    const actionResponse = await app.request("/actions/action-safe-risk-report");
    const actionBody = await json<{
      action: { decisionStatus: string; policyResult: { reasons: string[]; status: string } };
    }>(actionResponse);

    expect(actionBody.action.decisionStatus).toBe("blocked");
    expect(actionBody.action.policyResult.status).toBe("fail");
    expect(actionBody.action.policyResult.reasons).toContain("policy_revoked");
  });

  test("approved decisions require a wallet signature and store receipt metadata", async () => {
    const app = createTestApp();

    const missingSignature = await app.request("/actions/action-safe-risk-report/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "approved" }),
    });
    expect(missingSignature.status).toBe(400);

    const response = await app.request("/actions/action-safe-risk-report/decision", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decisionProof: seededDecisionOwnerProof({
          actionId: "action-safe-risk-report",
          receiptAddress: "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
          signature: "5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF",
          status: "approved",
        }),
        receiptAddress: "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
        signature: "5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF",
        status: "approved",
      }),
    });
    const body = await json<{
      action: {
        decisionReceiptAddress: string;
        decisionSignature: string;
        decisionStatus: string;
      };
    }>(response);

    expect(response.status).toBe(200);
    expect(body.action.decisionStatus).toBe("approved");
    expect(body.action.decisionSignature).toBe(
      "5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF",
    );
    expect(body.action.decisionReceiptAddress).toBe(
      "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
    );
  });
});
