import { beforeEach, describe, expect, test } from "vitest";
import type { ActionManifest, AgentPolicy } from "@skillguard/protocol";
import { buildAgentActionMessage } from "@skillguard/protocol";
import bs58 from "bs58";
import nacl from "tweetnacl";

import handler from "../../../api/[...path].ts";
import {
  buildConnectionOwnerMessage,
  buildConnectionRevokeOwnerMessage,
  buildWalletSessionOwnerMessage,
} from "./ownerProof.js";
import { createSeededStore } from "./seed.js";
import type { StoreSnapshot } from "./store.js";

type TestRequest = AsyncIterable<string | Uint8Array> & {
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
};

class TestResponse {
  body = "";
  headers = new Map<string, string>();
  statusCode = 200;

  constructor(private readonly onEnd: () => void = () => {}) {}

  end(body: string) {
    this.body = body;
    this.onEnd();
  }

  setHeader(name: string, value: string) {
    this.headers.set(name.toLowerCase(), value);
  }
}

async function callHandler(
  method: string,
  path: string,
  body?: unknown,
  onEnd?: () => void,
  headers?: Record<string, string>,
) {
  const req = {
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) {
        yield JSON.stringify(body);
      }
    },
    body,
    headers,
    method,
    url: `https://skillguard.test${path}`,
  } satisfies TestRequest;
  const res = new TestResponse(onEnd);

  await handler(req, res);

  return {
    body: JSON.parse(res.body) as { error?: string; [key: string]: unknown },
    status: res.statusCode,
  };
}

function testKeyPair(seedByte: number): nacl.SignKeyPair {
  return nacl.sign.keyPair.fromSeed(new Uint8Array(32).fill(seedByte));
}

function walletFor(keyPair: nacl.SignKeyPair): string {
  return bs58.encode(keyPair.publicKey);
}

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

function revokeProofFor({
  connectionId,
  keyPair,
  wallet,
}: {
  connectionId: string;
  keyPair: nacl.SignKeyPair;
  wallet: string;
}) {
  const signedAt = Date.now();
  return ownerProofForMessage(
    buildConnectionRevokeOwnerMessage({
      connectionId,
      signedAt,
      userWallet: wallet,
    }),
    keyPair,
    wallet,
  );
}

function walletSessionProofFor({
  keyPair,
  wallet,
}: {
  keyPair: nacl.SignKeyPair;
  wallet: string;
}) {
  const signedAt = Date.now();
  return ownerProofForMessage(
    buildWalletSessionOwnerMessage({ signedAt, userWallet: wallet }),
    keyPair,
    wallet,
  );
}

async function createWalletSessionViaHandler({
  keyPair,
  wallet,
}: {
  keyPair: nacl.SignKeyPair;
  wallet: string;
}): Promise<string> {
  const response = await callHandler("POST", "/api/wallet-sessions", {
    ownerProof: walletSessionProofFor({ keyPair, wallet }),
    wallet,
  });
  expect(response.status).toBe(201);
  const session = response.body.session as { token: string };
  expect(session.token).toMatch(/^sgw_/);
  return session.token;
}

function agentProofFor({
  agentId = "agent-research",
  connectionId,
  keyPair = testKeyPair(32),
  manifest,
  signedAt = Date.now(),
}: {
  agentId?: string;
  connectionId: string;
  keyPair?: nacl.SignKeyPair;
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

describe("Vercel API handler", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    const runtime = globalThis as { skillguardStore?: unknown };
    runtime.skillguardStore = undefined;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_URL;
    globalThis.fetch = originalFetch;
  });

  test("uses memory health locally when durable storage env is absent", async () => {
    const response = await callHandler("GET", "/api/health");

    expect(response).toEqual({
      body: {
        ok: true,
        service: "skillguard-api",
        storage: "memory",
      },
      status: 200,
    });
  });

  test("starts the production handler with no seeded agents", async () => {
    const response = await callHandler("GET", "/api/agents");

    expect(response).toEqual({
      body: { agents: [] },
      status: 200,
    });
  });

  test("initializes empty durable storage instead of seeding demo data", async () => {
    const events: string[] = [];
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      events.push(command[0]);
      if (command[0] === "GET") {
        return jsonRedisResponse(null);
      }
      if (command[0] === "SET") {
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const response = await callHandler("GET", "/api/agents");

    expect(response).toEqual({
      body: { agents: [] },
      status: 200,
    });
    expect(events).toEqual(["GET", "SET"]);
  });

  test("removes legacy seeded records from durable production storage", async () => {
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      if (command[0] === "GET") {
        return jsonRedisResponse(JSON.stringify(createSeededStore().toSnapshot()));
      }
      if (command[0] === "SET") {
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const response = await callHandler("GET", "/api/agents");

    expect(response).toEqual({
      body: { agents: [] },
      status: 200,
    });
  });

  test("removes legacy residue records and orphan legacy agents from durable production storage", async () => {
    const persisted: StoreSnapshot[] = [];
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      if (command[0] === "GET") {
        return jsonRedisResponse(
          JSON.stringify({
            actions: [
              {
                actionId: "action-demo-safe-smoke-1",
                connectionId: "conn-demo",
                decisionStatus: null,
                manifest: {
                  actionId: "action-demo-safe-smoke-1",
                  accountsTouched: ["DemoWallet111111111111111111111111111111111"],
                  agentId: "agent-research",
                  createdAt: 1_800_000_000,
                  expiresAt: 4_100_000_000,
                  kind: "wallet_risk_report",
                  network: "solana-devnet",
                  protocols: ["helius"],
                  rawTransactionRef: null,
                  riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
                  schemaVersion: "skillguard.action.v1",
                  spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
                  summary: "Smoke request.",
                  title: "Smoke request",
                  userWallet: "DemoWallet111111111111111111111111111111111",
                },
                policyResult: null,
              },
            ],
            agents: [
              {
                agentId: "agent-research",
                description: "Legacy Solana research agent.",
                name: "Research Agent",
                publicKey: walletFor(testKeyPair(32)),
              },
              {
                agentId: "agent-live",
                description: "User-created agent.",
                name: "Live Agent",
                publicKey: walletFor(testKeyPair(33)),
              },
            ],
            connections: [
              {
                agentId: "agent-research",
                connectionId: "conn-demo",
                policy: {
                  active: true,
                  agentId: "agent-research",
                  allowedMints: ["SOL", "USDC"],
                  allowedNetworks: ["solana-devnet"],
                  allowedProtocols: ["helius"],
                  dailySpendCapAtomic: "5000000",
                  expiresAt: 4_100_000_000,
                  maxSpendAtomic: "1000000",
                  mode: "ask_every_time",
                  policyId: "policy-demo",
                  revoked: false,
                  userWallet: "DemoWallet111111111111111111111111111111111",
                },
                userWallet: "DemoWallet111111111111111111111111111111111",
              },
              {
                agentId: "agent-live",
                connectionId: "conn-agent-live-Wallet111",
                policy: {
                  active: true,
                  agentId: "agent-live",
                  allowedMints: ["SOL", "USDC"],
                  allowedNetworks: ["solana-devnet"],
                  allowedProtocols: ["helius"],
                  dailySpendCapAtomic: "5000000",
                  expiresAt: 4_100_000_000,
                  maxSpendAtomic: "1000000",
                  mode: "ask_every_time",
                  policyId: "policy-live",
                  revoked: false,
                  userWallet: "Wallet111",
                },
                userWallet: "Wallet111",
              },
            ],
          } satisfies StoreSnapshot),
        );
      }
      if (command[0] === "SET") {
        persisted.push(JSON.parse(String(command[2])) as StoreSnapshot);
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const response = await callHandler("GET", "/api/agents");

    expect(response).toEqual({
      body: {
        agents: [
          {
            agentId: "agent-live",
            description: "User-created agent.",
            name: "Live Agent",
            publicKey: walletFor(testKeyPair(33)),
          },
        ],
      },
      status: 200,
    });
    expect(persisted.at(-1)).toMatchObject({
      actions: [],
      agents: [
        {
          agentId: "agent-live",
        },
      ],
      connections: [
        {
          agentId: "agent-live",
          connectionId: "conn-agent-live-Wallet111",
        },
      ],
    });
  });

  test("retains durable push tokens while loading production storage", async () => {
    const keyPair = testKeyPair(43);
    const wallet = walletFor(keyPair);
    const connectionId = "conn-live-push-durable";
    let stored: string | null = JSON.stringify({
      ...snapshotForConnection({ connectionId, wallet }),
      pushTokens: [{ token: "ExponentPushToken[durable-device]", userWallet: wallet }],
    } satisfies StoreSnapshot);
    const pushBodies: Array<{ to: string }> = [];
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (input, init) => {
      if (String(input).includes("redis.test")) {
        const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
        if (command[0] === "GET") {
          return jsonRedisResponse(stored);
        }
        if (command[0] === "SET") {
          stored = String(command[2]);
          return jsonRedisResponse("OK");
        }
      }

      pushBodies.push(JSON.parse(String(init?.body)) as { to: string });
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), {
        headers: { "content-type": "application/json" },
        status: 200,
      });
    };

    const manifest = pendingActionManifest({
      actionId: "action-vercel-durable-push",
      wallet,
    });
    const response = await callHandler("POST", "/api/actions", {
      agentProof: agentProofFor({ connectionId, manifest }),
      connectionId,
      manifest,
    });

    expect(response.status).toBe(201);
    expect(pushBodies).toMatchObject([{ to: "ExponentPushToken[durable-device]" }]);
    expect(JSON.parse(stored ?? "{}")).toMatchObject({
      pushTokens: [{ token: "ExponentPushToken[durable-device]", userWallet: wallet }],
    });
  });

  test("cleanup endpoint removes only smoke run artifacts", async () => {
    const wallet = "SmokeWalletCleanup111";
    const runId = "smoke-cleanup-1";
    const manifest: ActionManifest = {
      actionId: `action-demo-safe-${runId}`,
      accountsTouched: [wallet],
      agentId: "agent-research",
      createdAt: 1_800_000_000,
      expiresAt: 4_100_000_000,
      kind: "wallet_risk_report",
      network: "solana-devnet",
      protocols: ["helius"],
      rawTransactionRef: null,
      riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
      schemaVersion: "skillguard.action.v1",
      spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
      summary: "Smoke request.",
      title: "Smoke request",
      userWallet: wallet,
    };
    await createConnectionViaHandler({
      connectionId: `conn-agent-research-${wallet}`,
      wallet,
    });
    const actionResponse = await callHandler("POST", "/api/actions", {
      agentProof: agentProofFor({
        connectionId: `conn-agent-research-${wallet}`,
        manifest,
      }),
      connectionId: `conn-agent-research-${wallet}`,
      manifest,
    });
    expect(actionResponse.status).toBe(201);

    const cleanupResponse = await callHandler(
      "DELETE",
      `/api/smoke-runs/${encodeURIComponent(runId)}?wallet=${encodeURIComponent(wallet)}`,
    );
    expect(cleanupResponse.status).toBe(200);
    expect(cleanupResponse.body).toMatchObject({
      deleted: {
        actions: 1,
        agents: 1,
        connections: 1,
      },
    });

    expect(await callHandler("GET", `/api/actions?wallet=${wallet}`)).toEqual({
      body: { actions: [] },
      status: 200,
    });
    expect(await callHandler("GET", `/api/connections?wallet=${wallet}`)).toEqual({
      body: { connections: [] },
      status: 200,
    });
    expect(await callHandler("GET", "/api/agents")).toEqual({
      body: { agents: [] },
      status: 200,
    });
  });

  test("rejects malformed connection creation in the production handler path", async () => {
    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      userWallet: "DemoWallet111111111111111111111111111111111",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid_connection");
  });

  test("requires wallet session tokens for production wallet feeds", async () => {
    const keyPair = testKeyPair(31);
    const wallet = walletFor(keyPair);
    await createConnectionViaHandler({
      connectionId: `conn-agent-research-${wallet}`,
      keyPair,
      wallet,
    });

    const blocked = await callHandler("GET", `/api/connections?wallet=${wallet}`);
    expect(blocked).toEqual({
      body: { error: "wallet_session_required" },
      status: 401,
    });

    const token = await createWalletSessionViaHandler({ keyPair, wallet });
    const allowed = await callHandler(
      "GET",
      `/api/connections?wallet=${wallet}`,
      undefined,
      undefined,
      { "x-skillguard-wallet-session": token },
    );

    expect(allowed.status).toBe(200);
    expect((allowed.body.connections as Array<{ userWallet: string }>)[0]?.userWallet).toBe(wallet);
  });

  test("registers and removes production push tokens only with a wallet session", async () => {
    const keyPair = testKeyPair(41);
    const wallet = walletFor(keyPair);
    const blocked = await callHandler("POST", `/api/wallets/${wallet}/push-token`, {
      token: "ExponentPushToken[blocked]",
    });
    expect(blocked).toEqual({
      body: { error: "wallet_session_required" },
      status: 401,
    });

    const sessionToken = await createWalletSessionViaHandler({ keyPair, wallet });
    const registered = await callHandler(
      "POST",
      `/api/wallets/${wallet}/push-token`,
      { token: "ExponentPushToken[live-device]" },
      undefined,
      { "x-skillguard-wallet-session": sessionToken },
    );
    expect(registered).toEqual({
      body: { pushTokens: ["ExponentPushToken[live-device]"] },
      status: 201,
    });

    const removed = await callHandler(
      "DELETE",
      `/api/wallets/${wallet}/push-token`,
      { token: "ExponentPushToken[live-device]" },
      undefined,
      { "x-skillguard-wallet-session": sessionToken },
    );
    expect(removed).toEqual({
      body: { pushTokens: [] },
      status: 200,
    });
  });

  test("pushes pending production actions to registered wallet devices", async () => {
    const keyPair = testKeyPair(42);
    const wallet = walletFor(keyPair);
    const connectionId = `conn-agent-research-${wallet}`;
    const pushBodies: Array<{ to: string }> = [];
    globalThis.fetch = async (_input, init) => {
      const body = JSON.parse(String(init?.body)) as { to: string };
      pushBodies.push(body);
      const isDead = body.to === "ExponentPushToken[dead-device]";
      return new Response(
        JSON.stringify({
          data: [
            isDead
              ? {
                  details: { error: "DeviceNotRegistered" },
                  status: "error",
                }
              : { status: "ok" },
          ],
        }),
        { headers: { "content-type": "application/json" }, status: 200 },
      );
    };

    await createConnectionViaHandler({ connectionId, keyPair, wallet });
    const sessionToken = await createWalletSessionViaHandler({ keyPair, wallet });
    for (const token of ["ExponentPushToken[live-device]", "ExponentPushToken[dead-device]"]) {
      const response = await callHandler(
        "POST",
        `/api/wallets/${wallet}/push-token`,
        { token },
        undefined,
        { "x-skillguard-wallet-session": sessionToken },
      );
      expect(response.status).toBe(201);
    }

    const manifest = pendingActionManifest({
      actionId: "action-vercel-push-live",
      wallet,
    });
    const response = await callHandler("POST", "/api/actions", {
      agentProof: agentProofFor({ connectionId, manifest }),
      connectionId,
      manifest,
    });

    expect(response.status).toBe(201);
    expect(pushBodies).toEqual([
      {
        body: "Vercel secure request",
        data: {
          actionId: "action-vercel-push-live",
          kind: "new_action",
        },
        sound: "default",
        title: "Research Agent",
        to: "ExponentPushToken[live-device]",
      },
      {
        body: "Vercel secure request",
        data: {
          actionId: "action-vercel-push-live",
          kind: "new_action",
        },
        sound: "default",
        title: "Research Agent",
        to: "ExponentPushToken[dead-device]",
      },
    ]);

    const secondManifest = pendingActionManifest({
      actionId: "action-vercel-push-live-2",
      wallet,
    });
    await callHandler("POST", "/api/actions", {
      agentProof: agentProofFor({
        connectionId,
        manifest: secondManifest,
      }),
      connectionId,
      manifest: secondManifest,
    });
    expect(pushBodies.at(-1)?.to).toBe("ExponentPushToken[live-device]");
  });

  test("rejects action manifests that do not match the connection wallet", async () => {
    const wallet = walletFor(testKeyPair(11));
    await createConnectionViaHandler({
      connectionId: "conn-live",
      keyPair: testKeyPair(11),
      wallet,
    });

    const response = await callHandler("POST", "/api/actions", {
      connectionId: "conn-live",
      manifest: {
        actionId: "action-vercel-wallet-mismatch",
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
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("manifest_connection_mismatch");
  });

  test("blocks revoked connection reimport without owner proof through the production handler path", async () => {
    const wallet = walletFor(testKeyPair(12));
    await createConnectionViaHandler({
      connectionId: "conn-live",
      keyPair: testKeyPair(12),
      wallet,
    });
    await callHandler("POST", "/api/connections/conn-live/revoke", {
      ownerProof: revokeProofFor({
        connectionId: "conn-live",
        keyPair: testKeyPair(12),
        wallet,
      }),
    });

    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: "conn-live",
      policy: {
        agentId: "agent-research",
        active: true,
        allowedMints: ["SOL", "USDC"],
        allowedNetworks: ["solana-devnet"],
        allowedProtocols: ["helius", "birdeye"],
        dailySpendCapAtomic: "5000000",
        expiresAt: 4_100_000_000,
        maxSpendAtomic: "1000000",
        mode: "ask_every_time",
        policyId: "policy-reconnect-live",
        revoked: false,
        userWallet: wallet,
      },
      userWallet: wallet,
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("wallet_owner_proof_required");
  });

  test("reactivates a revoked connection with owner proof through the production handler path", async () => {
    const keyPair = testKeyPair(14);
    const wallet = walletFor(keyPair);
    await createConnectionViaHandler({
      connectionId: "conn-live",
      keyPair,
      wallet,
    });
    await callHandler("POST", "/api/connections/conn-live/revoke", {
      ownerProof: revokeProofFor({
        connectionId: "conn-live",
        keyPair,
        wallet,
      }),
    });

    const policy: AgentPolicy = {
      agentId: "agent-research",
      active: true,
      allowedMints: ["SOL"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "50000000",
      expiresAt: 4_100_000_000,
      maxSpendAtomic: "10000000",
      mode: "ask_every_time",
      policyId: "policy-reconnect-live",
      revoked: false,
      userWallet: wallet,
    };

    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: "conn-live",
      ownerProof: ownerProofFor({
        agentId: "agent-research",
        connectionId: "conn-live",
        keyPair,
        policy,
        userWallet: wallet,
      }),
      policy,
      userWallet: wallet,
    });

    expect(response.status).toBe(200);
    expect(response.body.connection).toMatchObject({
      connectionId: "conn-live",
      policy: {
        active: true,
        maxSpendAtomic: "10000000",
        policyId: "policy-reconnect-live",
        revoked: false,
      },
    });
  });

  test("rejects connection id reuse for a different wallet in the production handler path", async () => {
    const wallet = walletFor(testKeyPair(13));
    await createConnectionViaHandler({
      connectionId: "conn-live",
      keyPair: testKeyPair(13),
      wallet,
    });

    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: "conn-live",
      policy: {
        agentId: "agent-research",
        active: true,
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
    });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe("connection_id_conflict");
  });

  test("keeps a newly registered research agent until the wallet connection is created", async () => {
    let stored: string | null = null;
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      if (command[0] === "GET") {
        return jsonRedisResponse(stored);
      }
      if (command[0] === "SET") {
        stored = String(command[2]);
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const agentResponse = await callHandler("POST", "/api/agents", {
      agentId: "agent-research",
      description: "Solana research agent that requests wallet-safe actions.",
      name: "Research Agent",
      publicKey: walletFor(testKeyPair(32)),
    });
    expect(agentResponse.status).toBe(201);

    const keyPair = testKeyPair(14);
    const wallet = walletFor(keyPair);
    const connectionId = "conn-agent-research-Wallet111";
    const policy: AgentPolicy = {
      active: true,
      agentId: "agent-research",
      allowedMints: ["SOL", "USDC"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "5000000",
      expiresAt: 4_100_000_000,
      maxSpendAtomic: "1000000",
      mode: "ask_every_time",
      policyId: "policy-agent-research-Wallet111",
      revoked: false,
      userWallet: wallet,
    };
    const connectionResponse = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId,
      ownerProof: ownerProofFor({
        agentId: "agent-research",
        connectionId,
        keyPair,
        policy,
        userWallet: wallet,
      }),
      policy,
      userWallet: wallet,
    });

    expect(connectionResponse.status).toBe(201);
    expect(await callHandler("GET", "/api/agents")).toEqual({
      body: {
        agents: [
          {
            agentId: "agent-research",
            description: "Solana research agent that requests wallet-safe actions.",
            name: "Research Agent",
            publicKey: walletFor(testKeyPair(32)),
          },
        ],
      },
      status: 200,
    });
  });

  test("allows current smoke wallets until explicit smoke cleanup", async () => {
    let stored: string | null = null;
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      if (command[0] === "GET") {
        return jsonRedisResponse(stored);
      }
      if (command[0] === "SET") {
        stored = String(command[2]);
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const wallet = "SmokeWalletCurrent111";
    const runId = "smoke-current-1";
    await callHandler("POST", "/api/agents", {
      agentId: "agent-research",
      description: "Solana research agent that requests wallet-safe actions.",
      name: "Research Agent",
      publicKey: walletFor(testKeyPair(32)),
    });
    const connectionResponse = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: `conn-agent-research-${wallet}`,
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
        policyId: `policy-agent-research-${wallet}`,
        revoked: false,
        userWallet: wallet,
      },
      userWallet: wallet,
    });
    expect(connectionResponse.status).toBe(201);

    const manifest: ActionManifest = {
      actionId: `action-research-safe-${runId}`,
      accountsTouched: [wallet],
      agentId: "agent-research",
      createdAt: 1_800_000_000,
      expiresAt: 4_100_000_000,
      kind: "wallet_risk_report",
      network: "solana-devnet",
      protocols: ["helius"],
      rawTransactionRef: null,
      riskSignals: [{ code: "read_only", level: "low", message: "Read only." }],
      schemaVersion: "skillguard.action.v1",
      spend: [{ amountAtomic: "0", human: "0 USDC", mint: "USDC", reason: "Read only." }],
      summary: "Smoke request.",
      title: "Smoke request",
      userWallet: wallet,
    };
    const actionResponse = await callHandler("POST", "/api/actions", {
      agentProof: agentProofFor({
        connectionId: `conn-agent-research-${wallet}`,
        manifest,
      }),
      connectionId: `conn-agent-research-${wallet}`,
      manifest,
    });
    expect(actionResponse.status).toBe(201);

    const cleanupResponse = await callHandler(
      "DELETE",
      `/api/smoke-runs/${encodeURIComponent(runId)}?wallet=${encodeURIComponent(wallet)}`,
    );
    expect(cleanupResponse.body).toMatchObject({
      deleted: {
        actions: 1,
        agents: 1,
        connections: 1,
      },
    });
  });

  test("persists durable mutations before sending production responses", async () => {
    const events: string[] = [];
    const keyPair = testKeyPair(17);
    const wallet = walletFor(keyPair);
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      if (command[0] === "GET") {
        events.push("redis-get");
        return jsonRedisResponse(
          JSON.stringify(
            snapshotForConnection({
              connectionId: "conn-live",
              wallet,
            })
          )
        );
      }
      if (command[0] === "SET") {
        events.push("redis-set");
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const response = await callHandler(
      "POST",
      "/api/connections/conn-live/revoke",
      {
        ownerProof: revokeProofFor({
          connectionId: "conn-live",
          keyPair,
          wallet,
        }),
      },
      () => events.push("response-end"),
    );

    expect(response.status).toBe(200);
    expect(events).toEqual(["redis-get", "redis-set", "response-end"]);
  });
});

async function createConnectionViaHandler({
  agentKeyPair = testKeyPair(32),
  connectionId,
  keyPair = testKeyPair(31),
  wallet,
}: {
  agentKeyPair?: nacl.SignKeyPair;
  connectionId: string;
  keyPair?: nacl.SignKeyPair;
  wallet: string;
}) {
  await callHandler("POST", "/api/agents", {
    agentId: "agent-research",
    description: "Live test agent.",
    name: "Research Agent",
    publicKey: walletFor(agentKeyPair),
  });

  const policy: AgentPolicy = {
    agentId: "agent-research",
    active: true,
    allowedMints: ["SOL", "USDC"],
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: ["helius", "birdeye"],
    dailySpendCapAtomic: "5000000",
    expiresAt: 4_100_000_000,
    maxSpendAtomic: "1000000",
    mode: "ask_every_time",
    policyId: `policy-${connectionId}`,
    revoked: false,
    userWallet: wallet,
  };
  const response = await callHandler("POST", "/api/connections", {
    agentId: "agent-research",
    connectionId,
    ownerProof: ownerProofFor({
      agentId: "agent-research",
      connectionId,
      keyPair,
      policy,
      userWallet: wallet,
    }),
    policy,
    userWallet: wallet,
  });

  expect(response.status).toBe(201);
}

function snapshotForConnection({
  connectionId,
  wallet,
}: {
  connectionId: string;
  wallet: string;
}) {
  return {
    actions: [],
    agents: [
      {
        agentId: "agent-research",
        description: "Live test agent.",
        name: "Research Agent",
        publicKey: walletFor(testKeyPair(32)),
      },
    ],
    connections: [
      {
        agentId: "agent-research",
        connectionId,
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
          policyId: `policy-${connectionId}`,
          revoked: false,
          userWallet: wallet,
        },
        userWallet: wallet,
      },
    ],
  };
}

function pendingActionManifest({
  actionId,
  wallet,
}: {
  actionId: string;
  wallet: string;
}): ActionManifest {
  return {
    actionId,
    accountsTouched: [wallet],
    agentId: "agent-research",
    createdAt: 1_800_000_000,
    expiresAt: 4_100_000_000,
    kind: "wallet_risk_report",
    network: "solana-devnet",
    protocols: ["helius"],
    rawTransactionRef: null,
    riskSignals: [{ code: "manual_review", level: "medium", message: "Needs approval." }],
    schemaVersion: "skillguard.action.v1",
    spend: [{ amountAtomic: "1000000", human: "0.001 SOL", mint: "SOL", reason: "Paid report." }],
    summary: "Pending wallet request.",
    title: "Vercel secure request",
    userWallet: wallet,
  };
}

function jsonRedisResponse(result: unknown): Response {
  return new Response(JSON.stringify({ result }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
