#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_API_URL = "https://skillguard-sol.vercel.app/api";
const DEFAULT_EXPECTED_STORAGE = "upstash";

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), "..");

export function normalizeApiUrl(value = DEFAULT_API_URL) {
  const parsed = new URL(value);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Unsupported API URL protocol: ${parsed.protocol}`);
  }
  return parsed.toString().replace(/\/$/, "");
}

export function defaultSmokeIdentity(now = Date.now(), pid = process.pid) {
  return {
    runId: `smoke-${now}-${pid}`,
    wallet: `SmokeWallet${now}${pid}`,
  };
}

export function assertPolicyResult(label, payload, expectedStatus, expectedReason) {
  if (payload.policyStatus !== expectedStatus) {
    throw new Error(`${label} expected ${expectedStatus}, received ${payload.policyStatus}`);
  }

  const reasons = Array.isArray(payload.policyReasons) ? payload.policyReasons : [];
  const expectedReasons = Array.isArray(expectedReason) ? expectedReason : [expectedReason];
  if (!expectedReasons.some((reason) => reasons.includes(reason))) {
    throw new Error(
      `${label} expected reason ${expectedReasons.join(" or ")}, received ${reasons.join(", ")}`,
    );
  }
}

async function main() {
  const apiUrl = normalizeApiUrl(process.env.SKILLGUARD_API_URL ?? DEFAULT_API_URL);
  const defaults = defaultSmokeIdentity();
  const runId = process.env.SKILLGUARD_RUN_ID ?? defaults.runId;
  const wallet = process.env.SKILLGUARD_USER_WALLET ?? defaults.wallet;
  const expectedStorage = process.env.SKILLGUARD_EXPECT_STORAGE ?? DEFAULT_EXPECTED_STORAGE;

  const health = await requestJson(apiUrl, "health");
  if (health.storage !== expectedStorage) {
    throw new Error(`Expected storage ${expectedStorage}, received ${health.storage ?? "unknown"}`);
  }

  const safe = runDemoAgent("safe", apiUrl, wallet, runId);
  assertPolicyResult("safe", safe, "requires_approval", "policy_requires_manual_approval");

  const rejected = await requestJson(apiUrl, `actions/${safe.actionId}/decision`, {
    body: JSON.stringify({ status: "rejected" }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  if (rejected.action?.decisionStatus !== "rejected") {
    throw new Error(`Safe action was not rejected, received ${rejected.action?.decisionStatus}`);
  }

  const unsafe = runDemoAgent("unsafe", apiUrl, wallet, runId);
  assertPolicyResult("unsafe", unsafe, "fail", "spend_exceeds_max");

  const revoked = runDemoAgent("revoked", apiUrl, wallet, runId);
  assertPolicyResult("revoked", revoked, "fail", "policy_revoked");

  const listed = await requestJson(apiUrl, `actions?wallet=${encodeURIComponent(wallet)}`);
  const actions = Array.isArray(listed.actions) ? listed.actions : [];
  assertListedAction(actions, safe.actionId, "rejected");
  assertListedAction(actions, unsafe.actionId, "blocked");
  assertListedAction(actions, revoked.actionId, "blocked");

  console.log(
    JSON.stringify(
      {
        apiUrl,
        actions: {
          revoked: revoked.actionId,
          safe: safe.actionId,
          unsafe: unsafe.actionId,
        },
        ok: true,
        storage: health.storage,
        wallet,
      },
      null,
      2,
    ),
  );
}

async function requestJson(apiUrl, pathSegment, init) {
  const response = await fetch(new URL(pathSegment, `${apiUrl}/`), init);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`SkillGuard API ${response.status} for ${pathSegment}: ${JSON.stringify(body)}`);
  }
  return body;
}

function runDemoAgent(kind, apiUrl, wallet, runId) {
  const result = spawnSync(
    "npm",
    ["--prefix", "apps/demo-agent", "run", "--silent", `submit:${kind}`],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        SKILLGUARD_API_URL: apiUrl,
        SKILLGUARD_AUTO_CONNECT: "1",
        SKILLGUARD_RUN_ID: runId,
        SKILLGUARD_USER_WALLET: wallet,
      },
    },
  );

  if (result.status !== 0) {
    throw new Error(
      `Demo agent ${kind} failed with exit ${result.status}:\n${result.stderr || result.stdout}`,
    );
  }

  return parseJsonOutput(result.stdout, kind);
}

function parseJsonOutput(output, label) {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Demo agent ${label} did not print JSON:\n${output}`);
  }
  return JSON.parse(output.slice(start, end + 1));
}

function assertListedAction(actions, actionId, expectedDecisionStatus) {
  const action = actions.find((candidate) => candidate.actionId === actionId);
  if (!action) {
    throw new Error(`Action ${actionId} was not present in wallet action history`);
  }
  if (action.decisionStatus !== expectedDecisionStatus) {
    throw new Error(
      `Action ${actionId} expected decision ${expectedDecisionStatus}, received ${action.decisionStatus}`,
    );
  }
}

if (process.argv[1] === scriptPath) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
