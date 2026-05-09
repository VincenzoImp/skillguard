import { beforeEach, describe, expect, test } from "vitest";

import handler from "../../../api/[...path].ts";
import { createSeededStore } from "./seed.js";

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

  test("rejects malformed connection creation in the production handler path", async () => {
    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      userWallet: "DemoWallet111111111111111111111111111111111",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid_connection");
  });

  test("rejects action manifests that do not match the connection wallet", async () => {
    const response = await callHandler("POST", "/api/actions", {
      connectionId: "conn-demo",
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
    await callHandler("POST", "/api/connections/conn-demo/revoke");

    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: "conn-demo",
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
        policyId: "policy-reconnect-demo",
        revoked: false,
        userWallet: "DemoWallet111111111111111111111111111111111",
      },
      userWallet: "DemoWallet111111111111111111111111111111111",
    });

    expect(response.status).toBe(200);
    expect(response.body.connection).toMatchObject({
      connectionId: "conn-demo",
      policy: {
        active: false,
        revoked: true,
      },
    });
  });

  test("rejects connection id reuse for a different wallet in the production handler path", async () => {
    const response = await callHandler("POST", "/api/connections", {
      agentId: "agent-research",
      connectionId: "conn-demo",
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

  test("persists durable mutations before sending production responses", async () => {
    const events: string[] = [];
    process.env.KV_REST_API_TOKEN = "test-token";
    process.env.KV_REST_API_URL = "https://redis.test";
    globalThis.fetch = async (_input, init) => {
      const command = JSON.parse(String(init?.body)) as [string, ...unknown[]];
      if (command[0] === "GET") {
        events.push("redis-get");
        return jsonRedisResponse(JSON.stringify(createSeededStore().toSnapshot()));
      }
      if (command[0] === "SET") {
        events.push("redis-set");
        return jsonRedisResponse("OK");
      }
      throw new Error(`Unexpected Redis command ${command[0]}`);
    };

    const response = await callHandler(
      "POST",
      "/api/connections/conn-demo/revoke",
      undefined,
      () => events.push("response-end"),
    );

    expect(response.status).toBe(200);
    expect(events).toEqual(["redis-get", "redis-set", "response-end"]);
  });
});

function jsonRedisResponse(result: unknown): Response {
  return new Response(JSON.stringify({ result }), {
    headers: { "content-type": "application/json" },
    status: 200,
  });
}
