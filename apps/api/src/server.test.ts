import { describe, expect, test } from "vitest";

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

    const revokeResponse = await app.request("/connections/conn-seeded/revoke", { method: "POST" });
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
    const wallet = "Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx";

    const agentResponse = await app.request("/agents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-live",
        description: "Live agent used by the hackathon flow.",
        name: "Live Agent",
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
    expect(connectionResponse.status).toBe(201);

    const listResponse = await app.request(`/connections?wallet=${wallet}`);
    const body = await json<{
      connections: Array<{ agentId: string; connectionId: string; userWallet: string }>;
    }>(listResponse);

    expect(listResponse.status).toBe(200);
    expect(body.connections).toEqual([
      expect.objectContaining({
        agentId: "agent-live",
        connectionId: "conn-agent-live-Dd6t",
        userWallet: wallet,
      }),
    ]);
  });

  test("posted action is evaluated immediately and visible in wallet action feed", async () => {
    const app = createTestApp();

    const postResponse = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connectionId: "conn-seeded",
        manifest: {
          actionId: "action-live-safe",
          accountsTouched: ["FixtureWallet111111111111111111111111111111"],
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
          userWallet: "FixtureWallet111111111111111111111111111111",
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

    const feedResponse = await app.request(
      "/actions?wallet=FixtureWallet111111111111111111111111111111",
    );
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

  test("connection creation rejects missing fields instead of creating malformed records", async () => {
    const app = createTestApp();

    const response = await app.request("/connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        agentId: "agent-research",
        userWallet: "FixtureWallet111111111111111111111111111111",
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
    expect(
      await json<{ actions: unknown[] }>(
        await app.request("/actions?wallet=AttackerWallet111111111111111111111111111111"),
      ),
    ).toEqual({ actions: [] });
  });

  test("action creation rejects duplicate action ids instead of overwriting history", async () => {
    const app = createTestApp();

    const response = await app.request("/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        connectionId: "conn-seeded",
        manifest: {
          actionId: "action-safe-risk-report",
          accountsTouched: ["FixtureWallet111111111111111111111111111111"],
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
          userWallet: "FixtureWallet111111111111111111111111111111",
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
      body: JSON.stringify({ status: "rejected" }),
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

  test("connection upsert does not reactivate a revoked agent", async () => {
    const app = createTestApp();

    const revokeResponse = await app.request("/connections/conn-seeded/revoke", { method: "POST" });
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
          userWallet: "FixtureWallet111111111111111111111111111111",
        },
        userWallet: "FixtureWallet111111111111111111111111111111",
      }),
    });
    const reconnectBody = await json<{
      connection: { policy: { active: boolean; revoked: boolean } };
    }>(reconnectResponse);

    expect(reconnectResponse.status).toBe(200);
    expect(reconnectBody.connection.policy).toMatchObject({
      active: false,
      revoked: true,
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

    const revokeResponse = await app.request("/connections/conn-seeded", { method: "DELETE" });
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
