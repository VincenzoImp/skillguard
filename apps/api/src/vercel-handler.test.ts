import { beforeEach, describe, expect, test } from "vitest";

import handler from "../../../api/[...path].ts";
import { createSeededStore } from "./seed.js";
import type { StoreSnapshot } from "./store.js";

type TestRequest = AsyncIterable<string | Uint8Array> & {
  body?: unknown;
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
) {
  const req = {
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) {
        yield JSON.stringify(body);
      }
    },
    body,
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

    const response = await callHandler(
      "GET",
      "/api/connections?wallet=DemoWallet111111111111111111111111111111111",
    );

    expect(response).toEqual({
      body: { connections: [] },
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
              },
              {
                agentId: "agent-live",
                description: "User-created agent.",
                name: "Live Agent",
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

  test("cleanup endpoint removes only smoke run artifacts", async () => {
    const wallet = "SmokeWalletCleanup111";
    const runId = "smoke-cleanup-1";
    await createConnectionViaHandler({
      connectionId: `conn-agent-research-${wallet}`,
      wallet,
    });
    const actionResponse = await callHandler("POST", "/api/actions", {
      connectionId: `conn-agent-research-${wallet}`,
      manifest: {
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
      },
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

  test("rejects action manifests that do not match the connection wallet", async () => {
    await createConnectionViaHandler({
      connectionId: "conn-live",
      wallet: "Wallet111111111111111111111111111111111111",
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

  test("does not reactivate a revoked connection through the production handler path", async () => {
    await createConnectionViaHandler({
      connectionId: "conn-live",
      wallet: "Wallet111111111111111111111111111111111111",
    });
    await callHandler("POST", "/api/connections/conn-live/revoke");

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
        userWallet: "Wallet111111111111111111111111111111111111",
      },
      userWallet: "Wallet111111111111111111111111111111111111",
    });

    expect(response.status).toBe(200);
    expect(response.body.connection).toMatchObject({
      connectionId: "conn-live",
      policy: {
        active: false,
        revoked: true,
      },
    });
  });

  test("rejects connection id reuse for a different wallet in the production handler path", async () => {
    await createConnectionViaHandler({
      connectionId: "conn-live",
      wallet: "Wallet111111111111111111111111111111111111",
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
    });
    expect(agentResponse.status).toBe(201);

    const connectionResponse = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: "conn-agent-research-Wallet111",
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
        policyId: "policy-agent-research-Wallet111",
        revoked: false,
        userWallet: "Wallet111",
      },
      userWallet: "Wallet111",
    });

    expect(connectionResponse.status).toBe(201);
    expect(await callHandler("GET", "/api/agents")).toEqual({
      body: {
        agents: [
          {
            agentId: "agent-research",
            description: "Solana research agent that requests wallet-safe actions.",
            name: "Research Agent",
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

    const actionResponse = await callHandler("POST", "/api/actions", {
      connectionId: `conn-agent-research-${wallet}`,
      manifest: {
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
      },
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
              wallet: "Wallet111111111111111111111111111111111111",
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
      undefined,
      () => events.push("response-end"),
    );

    expect(response.status).toBe(200);
    expect(events).toEqual(["redis-get", "redis-set", "response-end"]);
  });
});

async function createConnectionViaHandler({
  connectionId,
  wallet,
}: {
  connectionId: string;
  wallet: string;
}) {
  await callHandler("POST", "/api/agents", {
    agentId: "agent-research",
    description: "Live test agent.",
    name: "Research Agent",
  });

  const response = await callHandler("POST", "/api/connections", {
    agentId: "agent-research",
    connectionId,
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
      policyId: `policy-${connectionId}`,
      revoked: false,
      userWallet: wallet,
    },
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

function jsonRedisResponse(result: unknown): Response {
  return new Response(JSON.stringify({ result }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
