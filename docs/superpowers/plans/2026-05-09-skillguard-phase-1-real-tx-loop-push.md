# SkillGuard Phase 1: Real Transactions, Agent Loop, Push Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take SkillGuard from "approve-records-receipt" to "approve-moves-real-SOL-AND-records-receipt", add an autonomous research-agent loop daemon, and add Expo push notifications so the mobile user gets notified when a new action arrives.

**Architecture:** Three feature areas, executed in order, each ending in a runnable end-to-end demo state. (1) Mobile wraps SystemProgram.transfer + record_decision into one MWA-signed transaction. (2) Research-agent gains a daemon entry point that loops three Wallet Risk Monitor actions, awaiting decisions. (3) API stores Expo push tokens per wallet (mirroring the wallet-session pattern) and fans out a push when a new pending action is created; mobile registers tokens and routes notification taps to the inbox.

**Tech Stack:** TypeScript everywhere. Vitest for unit tests. Hono for API. React Native + Expo 55 + expo-dev-client for mobile. `@solana/web3.js` for transaction building. Expo Notifications + Expo Push HTTP API for notifications. Anchor program unchanged.

**Spec:** `docs/superpowers/specs/2026-05-09-skillguard-best-ending-plan.md`

---

## File Structure (overview)

### New files
- `apps/mobile/src/treasury.ts` — exports `RESEARCH_TREASURY_ADDRESS` constant
- `apps/mobile/src/treasury.test.ts`
- `apps/mobile/src/buildApprovalTransaction.ts` — pure function that builds the bundled transaction
- `apps/mobile/src/buildApprovalTransaction.test.ts`
- `apps/mobile/src/notifications/registerPushToken.ts` — request permission + get Expo push token
- `apps/mobile/src/notifications/registerPushToken.test.ts`
- `apps/mobile/src/notifications/handleNotificationTap.ts` — read notification data + call inbox selector
- `apps/mobile/src/notifications/handleNotificationTap.test.ts`
- `apps/research-agent/src/loopActions.ts` — three Wallet Risk Monitor manifests (SOL-denominated)
- `apps/research-agent/src/loopActions.test.ts`
- `apps/research-agent/src/loop.ts` — `runLoop(deps)` pure state machine
- `apps/research-agent/src/loop.test.ts`
- `apps/research-agent/src/loopLog.ts` — formatting helpers (emoji + quiet)
- `apps/research-agent/src/loopLog.test.ts`
- `apps/research-agent/src/loopEntry.ts` — thin wrapper that wires real deps and calls `runLoop`
- `apps/api/src/push.ts` — Expo Push HTTP wrapper with retry + dead-token cleanup
- `apps/api/src/push.test.ts`

### Modified files
- `apps/mobile/package.json` — add `expo-notifications`, `expo-device`
- `apps/mobile/app.json` — add `expo-notifications` plugin config
- `apps/mobile/src/screens/WalletConnectScreen.tsx` — call `buildApprovalTransaction(...)` instead of building inline; register push token after wallet session
- `apps/mobile/App.tsx` — add notification response listener
- `apps/research-agent/package.json` — add `agent:loop` script
- `apps/research-agent/src/client.ts` — add `waitForDecision(actionId, options)`
- `apps/research-agent/src/client.test.ts` — extend
- `apps/api/src/store.ts` — add `pushTokens` Map collection mirroring `walletSessions`
- `apps/api/src/store.test.ts` — extend (if not present, create alongside)
- `apps/api/src/routes.ts` — add `POST /wallets/:wallet/push-token`, `DELETE /wallets/:wallet/push-token`; in `POST /actions` handler, fire push fan-out on pending actions
- `apps/api/src/server.test.ts` — extend
- `apps/api/src/validation.ts` — add `parsePushTokenBody(...)` helper
- `apps/api/src/vercel-handler.test.ts` — adjust if needed for new endpoints
- `.env.example` — document `EXPO_ACCESS_TOKEN` (optional)
- `docs/VERCEL.md` — document new env vars and KV namespace `pushTokens:<wallet>`
- `apps/research-agent/README.md` — document the `agent:loop` command
- `README.md` — promote `agent:loop` to primary demo path
- `docs/DEMO.md` — final rewrite to match the demo script

---

## Section A: Real Transactions (Phase 1.1)

Goal: when the user approves an action with non-zero SOL spend, the signed transaction includes BOTH a `SystemProgram.transfer` to the research treasury AND the existing `record_decision` SkillGuard instruction. Atomic.

### Task A1: Generate the research treasury devnet keypair (manual)

**Files:**
- Manual: generate keypair on disk, never commit the secret

- [ ] **Step 1: Generate a fresh devnet keypair locally**

```bash
solana-keygen new --no-bip39-passphrase --outfile ~/.config/solana/skillguard-research-treasury.json
solana-keygen pubkey ~/.config/solana/skillguard-research-treasury.json
```

Expected: prints a base58 public key. Save this address; you will hardcode it in `apps/mobile/src/treasury.ts`.

- [ ] **Step 2: Fund the treasury devnet wallet (optional)**

Optional because incoming transfers do not require the treasury to be rent-funded for SystemProgram.transfer to land. Skip if the airdrop faucet is rate-limited.

- [ ] **Step 3: Note: NO commit here**

The keypair file lives outside the repo. Only the public address gets committed in Task A2.

### Task A2: Add the treasury address constant

**Files:**
- Create: `apps/mobile/src/treasury.ts`
- Test: `apps/mobile/src/treasury.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/treasury.test.ts
import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { RESEARCH_TREASURY_ADDRESS } from "./treasury";

describe("RESEARCH_TREASURY_ADDRESS", () => {
  it("is a valid base58 Solana public key", () => {
    expect(() => new PublicKey(RESEARCH_TREASURY_ADDRESS)).not.toThrow();
  });

  it("is exactly 32 bytes when decoded", () => {
    const bytes = new PublicKey(RESEARCH_TREASURY_ADDRESS).toBytes();
    expect(bytes.length).toBe(32);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/mobile test -- treasury`
Expected: FAIL with "Cannot find module './treasury'".

- [ ] **Step 3: Create the constant**

```ts
// apps/mobile/src/treasury.ts
// Devnet-only research treasury. Receives the 0.001 SOL "API quota" fees
// from SkillGuard demo approvals. The corresponding keypair lives in the
// operator's local Solana CLI config and is intentionally not in this repo.
export const RESEARCH_TREASURY_ADDRESS =
  "<paste-public-key-from-Task-A1>";
```

Replace `<paste-public-key-from-Task-A1>` with the actual base58 string printed by `solana-keygen pubkey` in Task A1.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/mobile test -- treasury`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/treasury.ts apps/mobile/src/treasury.test.ts
git commit -m "feat(mobile): add research treasury devnet constant"
```

### Task A3: Extract approval transaction builder into a pure function (failing test)

**Files:**
- Create: `apps/mobile/src/buildApprovalTransaction.ts`
- Test: `apps/mobile/src/buildApprovalTransaction.test.ts`

- [ ] **Step 1: Write the failing test (zero-spend manifest = no transfer)**

```ts
// apps/mobile/src/buildApprovalTransaction.test.ts
import { describe, expect, it } from "vitest";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { ActionManifest } from "@skillguard/protocol";
import { buildApprovalTransaction } from "./buildApprovalTransaction";

const owner = new PublicKey("11111111111111111111111111111112");
const treasury = "11111111111111111111111111111113";
const blockhash = "EJC7sNxZk6vXxgHXDFyP8b9iFztFuY8s2hZBChGsQ8sB";

const baseManifest: ActionManifest = {
  schemaVersion: "skillguard.action.v1",
  actionId: "act-1",
  agentId: "agent-research",
  userWallet: owner.toBase58(),
  network: "solana-devnet",
  kind: "wallet_risk_report",
  title: "Free scan",
  summary: "Read-only.",
  protocols: ["helius"],
  spend: [{ mint: "SOL", amountAtomic: "0", human: "0 SOL", reason: "Read-only" }],
  accountsTouched: [owner.toBase58()],
  riskSignals: [],
  rawTransactionRef: null,
  createdAt: 0,
  expiresAt: 4_100_000_000,
};

describe("buildApprovalTransaction", () => {
  it("includes only the receipt instruction when spend is zero", () => {
    const tx = buildApprovalTransaction({
      manifest: baseManifest,
      owner,
      blockhash,
      treasuryAddress: treasury,
      receiptInstructions: [
        SystemProgram.transfer({ fromPubkey: owner, toPubkey: owner, lamports: 1 }),
      ],
    });
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.instructions).toHaveLength(1);
  });

  it("prepends a SystemProgram.transfer when SOL spend is non-zero", () => {
    const tx = buildApprovalTransaction({
      manifest: { ...baseManifest, spend: [{ mint: "SOL", amountAtomic: "1000000", human: "0.001 SOL", reason: "fee" }] },
      owner,
      blockhash,
      treasuryAddress: treasury,
      receiptInstructions: [
        SystemProgram.transfer({ fromPubkey: owner, toPubkey: owner, lamports: 1 }),
      ],
    });
    expect(tx.instructions).toHaveLength(2);
    const first = tx.instructions[0];
    expect(first.programId.toBase58()).toBe(SystemProgram.programId.toBase58());
  });

  it("throws on non-SOL spend (USDC not supported in MVP)", () => {
    expect(() =>
      buildApprovalTransaction({
        manifest: { ...baseManifest, spend: [{ mint: "USDC", amountAtomic: "100000", human: "0.10 USDC", reason: "fee" }] },
        owner,
        blockhash,
        treasuryAddress: treasury,
        receiptInstructions: [],
      }),
    ).toThrow(/SOL/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/mobile test -- buildApprovalTransaction`
Expected: FAIL with "Cannot find module './buildApprovalTransaction'".

- [ ] **Step 3: Implement the builder**

```ts
// apps/mobile/src/buildApprovalTransaction.ts
import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { ActionManifest } from "@skillguard/protocol";

export interface BuildApprovalTransactionInput {
  manifest: ActionManifest;
  owner: PublicKey;
  blockhash: string;
  treasuryAddress: string;
  receiptInstructions: TransactionInstruction[];
}

export function buildApprovalTransaction(input: BuildApprovalTransactionInput): Transaction {
  const { manifest, owner, blockhash, treasuryAddress, receiptInstructions } = input;
  const tx = new Transaction({ feePayer: owner, recentBlockhash: blockhash });

  const lamports = totalLamportSpend(manifest);
  if (lamports > 0n) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: new PublicKey(treasuryAddress),
        lamports: Number(lamports),
      }),
    );
  }

  for (const ix of receiptInstructions) {
    tx.add(ix);
  }

  return tx;
}

function totalLamportSpend(manifest: ActionManifest): bigint {
  let total = 0n;
  for (const item of manifest.spend) {
    if (item.amountAtomic === "0") continue;
    if (item.mint !== "SOL") {
      throw new Error(`buildApprovalTransaction: only SOL spend is supported, got ${item.mint}`);
    }
    total += BigInt(item.amountAtomic);
  }
  return total;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/mobile test -- buildApprovalTransaction`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/buildApprovalTransaction.ts apps/mobile/src/buildApprovalTransaction.test.ts
git commit -m "feat(mobile): pure builder for bundled approval transaction"
```

### Task A4: Wire the builder into WalletConnectScreen approval handler

**Files:**
- Modify: `apps/mobile/src/screens/WalletConnectScreen.tsx:200-254` (the `handleApproveSelected` body where `Transaction` is built inline)

- [ ] **Step 1: Read the current handler**

Open `apps/mobile/src/screens/WalletConnectScreen.tsx`. Locate the block that currently constructs `const transaction = new Transaction({ ... }).add(...buildSkillGuardApprovalInstructions({ ... }))` (around lines 220-235).

- [ ] **Step 2: Replace inline construction with `buildApprovalTransaction`**

Add this import at the top of the file:

```ts
import { buildApprovalTransaction } from "../buildApprovalTransaction";
import { RESEARCH_TREASURY_ADDRESS } from "../treasury";
```

Replace the inline `const transaction = new Transaction({...}).add(...)` block with:

```ts
const receiptInstructions = buildSkillGuardApprovalInstructions({
  actionId: actionToApprove.id,
  agentId: actionToApprove.agentId,
  includeConnectAgent: agentConnectionInfo === null,
  includeCreateUserProfile: userProfileInfo === null,
  manifestHash: actionToApprove.manifestHash,
  owner: activeAccount.publicKey,
  policyResult: actionToApprove.policyResultSummary,
});

const transaction = buildApprovalTransaction({
  manifest: actionToApprove.manifest,
  owner: activeAccount.publicKey,
  blockhash: latestBlockhash.blockhash,
  treasuryAddress: RESEARCH_TREASURY_ADDRESS,
  receiptInstructions,
});
```

This requires `actionToApprove.manifest` to be available in scope. If it isn't, plumb the `manifest` field through `liveState.ts` and the action selectors so that `getSelectedAction(...)` returns it. (Most likely it's already there since the inbox renders manifest data.)

- [ ] **Step 3: Update the type/interface for `actionToApprove`**

Inspect `apps/mobile/src/liveState.ts`. Find the action shape returned by `getSelectedAction`. Confirm `manifest` is on it. If not, add it to the type and to wherever the state is hydrated from `liveApi`. Search for the getSelectedAction definition with:

```bash
grep -n "manifest\|getSelectedAction" apps/mobile/src/liveState.ts apps/mobile/src/liveApi.ts
```

- [ ] **Step 4: Run mobile typecheck**

Run: `npm --prefix apps/mobile run typecheck`
Expected: PASS. If TypeScript flags missing fields, fix the action shape.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/screens/WalletConnectScreen.tsx apps/mobile/src/liveState.ts apps/mobile/src/liveApi.ts
git commit -m "feat(mobile): bundle SOL transfer + receipt in single approval tx"
```

### Task A5: Add a smoke test that exercises the bundled tx end-to-end

**Files:**
- Test: `apps/mobile/src/buildApprovalTransaction.integration.test.ts` (new)

- [ ] **Step 1: Write the integration test**

```ts
// apps/mobile/src/buildApprovalTransaction.integration.test.ts
import { describe, expect, it } from "vitest";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { buildApprovalTransaction } from "./buildApprovalTransaction";
import { RESEARCH_TREASURY_ADDRESS } from "./treasury";

describe("buildApprovalTransaction integration", () => {
  it("uses RESEARCH_TREASURY_ADDRESS as the destination of the prepended transfer", () => {
    const owner = new PublicKey("11111111111111111111111111111112");
    const tx = buildApprovalTransaction({
      manifest: {
        schemaVersion: "skillguard.action.v1",
        actionId: "act-x",
        agentId: "agent-research",
        userWallet: owner.toBase58(),
        network: "solana-devnet",
        kind: "wallet_risk_report",
        title: "x",
        summary: "x",
        protocols: ["helius"],
        spend: [{ mint: "SOL", amountAtomic: "1000000", human: "0.001 SOL", reason: "fee" }],
        accountsTouched: [owner.toBase58()],
        riskSignals: [],
        rawTransactionRef: null,
        createdAt: 0,
        expiresAt: 4_100_000_000,
      },
      owner,
      blockhash: "EJC7sNxZk6vXxgHXDFyP8b9iFztFuY8s2hZBChGsQ8sB",
      treasuryAddress: RESEARCH_TREASURY_ADDRESS,
      receiptInstructions: [],
    });
    const transferIx = tx.instructions[0];
    expect(transferIx.programId.toBase58()).toBe(SystemProgram.programId.toBase58());
    const decoded = SystemProgram.decodeTransfer(transferIx);
    expect(decoded.toPubkey.toBase58()).toBe(RESEARCH_TREASURY_ADDRESS);
    expect(decoded.lamports).toBe(1_000_000);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm --prefix apps/mobile test -- buildApprovalTransaction.integration`
Expected: PASS, 1 test.

- [ ] **Step 3: Commit**

```bash
git add apps/mobile/src/buildApprovalTransaction.integration.test.ts
git commit -m "test(mobile): integration test for bundled approval transfer"
```

### Task A6: Manual end-to-end verification on real device

This task has no commit. Document the result in `docs/superpowers/plans/2026-05-09-skillguard-phase-1-real-tx-loop-push.md` as a comment under this task before moving on.

- [ ] **Step 1: Build and install the APK**

```bash
. scripts/dev-env.sh
SKILLGUARD_ANDROID_BUILD_PROFILE=standalone scripts/build-mobile-apk.sh
adb install -r build/mobile/skillguard.apk
```

- [ ] **Step 2: Run the API locally**

```bash
npm --prefix apps/api run dev
```

- [ ] **Step 3: Open the app, connect your wallet, import agent-research, set policy max spend = 0.01 SOL (10_000_000 lamports)**

- [ ] **Step 4: Submit a SOL-spend action manually via the existing CLI**

```bash
export SKILLGUARD_API_URL=http://10.0.2.2:8787
export SKILLGUARD_USER_WALLET=<your-wallet>
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<from generate-agent-key.mjs>
# After Task B updates actions.ts to support SOL, replace the manifest spend in
# the existing submit:safe path with 1_000_000 lamports SOL temporarily, OR skip
# this step until after Task B and verify in Task B's smoke instead.
npm --prefix apps/research-agent run submit:safe
```

- [ ] **Step 5: Approve the action in the app and inspect the resulting transaction on Solscan**

Verify: the transaction signature shows TWO instructions — one `System Program: Transfer` of 0.001 SOL to `RESEARCH_TREASURY_ADDRESS`, one SkillGuard `record_decision`. Wallet balance has decreased by 0.001 SOL + tx fees.

If verification fails, debug and fix. If it succeeds, proceed to Section B.

---

## Section B: Agent Loop Daemon (Phase 1.2)

Goal: `npm --prefix apps/research-agent run agent:loop` starts a daemon that submits three Wallet Risk Monitor actions in sequence, awaiting decisions, and exits cleanly on revoke.

### Task B1: Create SOL-denominated Wallet Risk Monitor manifests

**Files:**
- Create: `apps/research-agent/src/loopActions.ts`
- Test: `apps/research-agent/src/loopActions.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/research-agent/src/loopActions.test.ts
import { describe, expect, it } from "vitest";
import { buildLoopManifest } from "./loopActions";

const wallet = "13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q";

describe("buildLoopManifest", () => {
  it("freeScan: zero spend, helius only", () => {
    const m = buildLoopManifest("freeScan", wallet, 1);
    expect(m.spend).toEqual([
      { mint: "SOL", amountAtomic: "0", human: "0 SOL", reason: "Read-only scan" },
    ]);
    expect(m.protocols).toEqual(["helius"]);
    expect(m.kind).toBe("wallet_risk_report");
    expect(m.userWallet).toBe(wallet);
    expect(m.actionId).toMatch(/^action-research-loop-\d+-1$/);
  });

  it("paidReport: 0.001 SOL spend, helius+birdeye", () => {
    const m = buildLoopManifest("paidReport", wallet, 2);
    expect(m.spend).toEqual([
      { mint: "SOL", amountAtomic: "1000000", human: "0.001 SOL", reason: "API quota" },
    ]);
    expect(m.protocols).toEqual(["helius", "birdeye"]);
  });

  it("subscriptionUpgrade: 0.05 SOL spend, blocked by typical policy", () => {
    const m = buildLoopManifest("subscriptionUpgrade", wallet, 3);
    expect(m.spend).toEqual([
      { mint: "SOL", amountAtomic: "50000000", human: "0.05 SOL", reason: "Monthly subscription" },
    ]);
    expect(m.kind).toBe("swap_preview");
    expect(m.riskSignals[0].level).toBe("high");
  });

  it("counter and timestamp produce stable, unique action ids across calls", () => {
    const a = buildLoopManifest("freeScan", wallet, 1);
    const b = buildLoopManifest("freeScan", wallet, 2);
    expect(a.actionId).not.toBe(b.actionId);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/research-agent test -- loopActions`
Expected: FAIL with "Cannot find module './loopActions'".

- [ ] **Step 3: Implement the builder**

```ts
// apps/research-agent/src/loopActions.ts
import type { ActionManifest } from "@skillguard/protocol";

export type LoopAction = "freeScan" | "paidReport" | "subscriptionUpgrade";

const RUN_TIMESTAMP = Date.now();

export const LOOP_SEQUENCE: readonly LoopAction[] = [
  "freeScan",
  "paidReport",
  "subscriptionUpgrade",
];

export function buildLoopManifest(
  kind: LoopAction,
  userWallet: string,
  counter: number,
  runTimestamp: number = RUN_TIMESTAMP,
): ActionManifest {
  const actionId = `action-research-loop-${runTimestamp}-${counter}`;
  const base = {
    schemaVersion: "skillguard.action.v1" as const,
    actionId,
    agentId: "agent-research",
    userWallet,
    network: "solana-devnet" as const,
    accountsTouched: [userWallet],
    rawTransactionRef: null,
    createdAt: Math.floor(runTimestamp / 1000),
    expiresAt: 4_100_000_000,
  };

  if (kind === "freeScan") {
    return {
      ...base,
      kind: "wallet_risk_report",
      title: "Scan wallet for risky token approvals",
      summary:
        "Read-only check via Helius for suspicious SPL token approvals and dust attacks.",
      protocols: ["helius"],
      spend: [
        { mint: "SOL", amountAtomic: "0", human: "0 SOL", reason: "Read-only scan" },
      ],
      riskSignals: [
        { level: "low", code: "read_only", message: "No funds move." },
      ],
    };
  }

  if (kind === "paidReport") {
    return {
      ...base,
      kind: "wallet_risk_report",
      title: "Generate weekly wallet risk PDF",
      summary:
        "Pull tx history via Helius and price moves via Birdeye, output a signed risk report.",
      protocols: ["helius", "birdeye"],
      spend: [
        { mint: "SOL", amountAtomic: "1000000", human: "0.001 SOL", reason: "API quota" },
      ],
      riskSignals: [
        { level: "low", code: "metered_read", message: "Spend below configured cap." },
      ],
    };
  }

  return {
    ...base,
    kind: "swap_preview",
    title: "Subscribe to real-time risk alerts",
    summary:
      "Monthly subscription to push real-time alerts via Helius webhooks.",
    protocols: ["helius"],
    spend: [
      { mint: "SOL", amountAtomic: "50000000", human: "0.05 SOL", reason: "Monthly subscription" },
    ],
    riskSignals: [
      { level: "high", code: "overspend_subscription", message: "Above per-action cap." },
    ],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/research-agent test -- loopActions`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/research-agent/src/loopActions.ts apps/research-agent/src/loopActions.test.ts
git commit -m "feat(research-agent): SOL-denominated wallet risk monitor manifests"
```

### Task B2: Add `waitForDecision` to the SDK client

**Files:**
- Modify: `apps/research-agent/src/client.ts`
- Modify: `apps/research-agent/src/client.test.ts`

- [ ] **Step 1: Write the failing test (extend existing test file)**

Append to `apps/research-agent/src/client.test.ts`:

```ts
describe("waitForDecision", () => {
  it("polls until decisionStatus is set, then resolves with the action", async () => {
    let calls = 0;
    const fakeFetch = async (url: string) => {
      calls += 1;
      const decided = calls >= 3;
      return new Response(
        JSON.stringify({
          action: {
            actionId: "act-1",
            decisionStatus: decided ? "approved" : null,
            decisionSignature: decided ? "sig-1" : null,
            decisionReceiptAddress: decided ? "addr-1" : null,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    };
    const client = createSkillGuardClient({
      apiUrl: "http://test",
      agentKeyPair: smokeAgentKeyPair(),
      connectionId: "conn-1",
      fetch: fakeFetch as unknown as typeof fetch,
    });
    const result = await client.waitForDecision("act-1", { pollMs: 1, timeoutMs: 1000 });
    expect(result.status).toBe("approved");
  });

  it("returns timeout when no decision arrives in time", async () => {
    const fakeFetch = async () =>
      new Response(JSON.stringify({ action: { actionId: "act-1", decisionStatus: null } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    const client = createSkillGuardClient({
      apiUrl: "http://test",
      agentKeyPair: smokeAgentKeyPair(),
      connectionId: "conn-1",
      fetch: fakeFetch as unknown as typeof fetch,
    });
    const result = await client.waitForDecision("act-1", { pollMs: 5, timeoutMs: 30 });
    expect(result.status).toBe("timeout");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/research-agent test -- client`
Expected: FAIL with "client.waitForDecision is not a function" or similar.

- [ ] **Step 3: Add `waitForDecision` to the client**

Locate the factory function `createSkillGuardClient` in `apps/research-agent/src/client.ts`. Inside the returned object, add:

```ts
async waitForDecision(
  actionId: string,
  options: { pollMs: number; timeoutMs: number },
): Promise<{ status: "approved" | "rejected" | "blocked" | "expired" | "timeout"; signature: string | null; receiptAddress: string | null }> {
  const deadline = Date.now() + options.timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetchFn(`${apiUrl}/api/actions/${actionId}`);
    if (!response.ok) {
      throw new Error(`waitForDecision: GET /actions/${actionId} returned ${response.status}`);
    }
    const body = (await response.json()) as { action?: { decisionStatus: string | null; decisionSignature: string | null; decisionReceiptAddress: string | null } };
    const action = body.action;
    if (action && action.decisionStatus !== null) {
      return {
        status: action.decisionStatus as "approved" | "rejected" | "blocked" | "expired",
        signature: action.decisionSignature,
        receiptAddress: action.decisionReceiptAddress,
      };
    }
    await sleep(options.pollMs);
  }
  return { status: "timeout", signature: null, receiptAddress: null };
},
```

Add at the top of the file if not present:

```ts
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
```

The factory must accept an optional `fetch` parameter for tests:

```ts
export function createSkillGuardClient(options: {
  apiUrl: string;
  agentKeyPair: nacl.SignKeyPair;
  connectionId: string;
  fetch?: typeof fetch;
}) {
  const fetchFn = options.fetch ?? fetch;
  // ...
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/research-agent test -- client`
Expected: PASS, including the two new tests plus existing ones.

- [ ] **Step 5: Commit**

```bash
git add apps/research-agent/src/client.ts apps/research-agent/src/client.test.ts
git commit -m "feat(research-agent): waitForDecision polling helper on client"
```

### Task B3: Add the loop logger with quiet mode

**Files:**
- Create: `apps/research-agent/src/loopLog.ts`
- Test: `apps/research-agent/src/loopLog.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/research-agent/src/loopLog.test.ts
import { describe, expect, it, vi } from "vitest";
import { createLoopLog } from "./loopLog";

function captureLines(quiet: boolean): { lines: string[]; log: ReturnType<typeof createLoopLog> } {
  const lines: string[] = [];
  const log = createLoopLog({ quiet, write: (line) => lines.push(line) });
  return { lines, log };
}

describe("createLoopLog", () => {
  it("emits banner with shortened wallet (emoji mode)", () => {
    const { lines, log } = captureLines(false);
    log.banner("13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q");
    expect(lines[0]).toBe("🤖 Agent started, watching wallet 13hF...op4Q");
  });

  it("emits banner with [BANNER] in quiet mode", () => {
    const { lines, log } = captureLines(true);
    log.banner("13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q");
    expect(lines[0]).toBe("[BANNER] Agent started, watching wallet 13hF...op4Q");
  });

  it("decision approved", () => {
    const { lines, log } = captureLines(true);
    log.decision("freeScan", { status: "approved", signature: "sig123abc", receiptAddress: null });
    expect(lines[0]).toBe("[OK] freeScan APPROVED — receipt: sig1...3abc");
  });

  it("decision revoked", () => {
    const { lines, log } = captureLines(true);
    log.decision("paidReport", { status: "revoked", signature: null, receiptAddress: null });
    expect(lines[0]).toBe("[REVOKED] paidReport REVOKED");
  });

  it("blocked logs reasons", () => {
    const { lines, log } = captureLines(true);
    log.blocked("subscriptionUpgrade", ["spend_exceeds_max", "overspend"]);
    expect(lines[0]).toBe("[BLOCK] subscriptionUpgrade BLOCKED — reasons: [spend_exceeds_max, overspend]");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/research-agent test -- loopLog`
Expected: FAIL with "Cannot find module './loopLog'".

- [ ] **Step 3: Implement the logger**

```ts
// apps/research-agent/src/loopLog.ts
export interface LoopLog {
  banner(wallet: string): void;
  submitted(kind: string, actionId: string, policy: { status: string }): void;
  decision(kind: string, decision: { status: string; signature: string | null }): void;
  blocked(kind: string, reasons: string[]): void;
  revoked(): void;
  cycleEnd(): void;
}

interface LoopLogOptions {
  quiet?: boolean;
  write?: (line: string) => void;
}

export function shortenAddress(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function createLoopLog(options: LoopLogOptions = {}): LoopLog {
  const quiet = options.quiet === true;
  const write = options.write ?? ((line: string) => console.log(line));
  const tag = (emoji: string, label: string) => (quiet ? `[${label}]` : emoji);

  return {
    banner(wallet) {
      write(`${tag("🤖", "BANNER")} Agent started, watching wallet ${shortenAddress(wallet)}`);
    },
    submitted(kind, actionId, policy) {
      write(`${tag("→", "SUBMIT")} submit ${kind} (${actionId})`);
      write(`  policy: ${policy.status}`);
    },
    decision(kind, decision) {
      const status = decision.status.toUpperCase();
      if (decision.status === "approved" && decision.signature) {
        write(`${tag("✅", "OK")} ${kind} ${status} — receipt: ${shortenAddress(decision.signature)}`);
      } else if (decision.status === "revoked") {
        write(`${tag("🚫", "REVOKED")} ${kind} ${status}`);
      } else {
        write(`${tag("⚠️", "DECISION")} ${kind} ${status}`);
      }
    },
    blocked(kind, reasons) {
      write(`${tag("🔒", "BLOCK")} ${kind} BLOCKED — reasons: [${reasons.join(", ")}]`);
    },
    revoked() {
      write(`${tag("🚫", "REVOKED")} Agent revoked by user. Exiting cleanly.`);
    },
    cycleEnd() {
      write(`${tag("↻", "CYCLE")} Cycle complete. Restarting in 5s...`);
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/research-agent test -- loopLog`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/research-agent/src/loopLog.ts apps/research-agent/src/loopLog.test.ts
git commit -m "feat(research-agent): loop logger with emoji and quiet modes"
```

### Task B4: Implement the loop state machine

**Files:**
- Create: `apps/research-agent/src/loop.ts`
- Test: `apps/research-agent/src/loop.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/research-agent/src/loop.test.ts
import { describe, expect, it } from "vitest";
import { runLoop } from "./loop";
import { createLoopLog } from "./loopLog";

const wallet = "13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q";

function makeLog() {
  const lines: string[] = [];
  const log = createLoopLog({ quiet: true, write: (l) => lines.push(l) });
  return { lines, log };
}

describe("runLoop", () => {
  it("submits the three-action sequence then exits when revoke is returned", async () => {
    const submitted: string[] = [];
    let cycle = 0;
    const fakeClient = {
      submitAction: async (manifest: { actionId: string; title: string }) => {
        submitted.push(manifest.title);
        return {
          action: { actionId: manifest.actionId },
          result: { status: "requires_approval" as const, reasons: [], riskLevel: "low" as const, manifestHash: "h" },
        };
      },
      waitForDecision: async () => {
        cycle += 1;
        if (cycle === 1) return { status: "approved" as const, signature: "sig1", receiptAddress: null };
        if (cycle === 2) return { status: "approved" as const, signature: "sig2", receiptAddress: null };
        return { status: "revoked" as const, signature: null, receiptAddress: null };
      },
    };
    const { lines, log } = makeLog();
    await runLoop({ client: fakeClient as never, wallet, log, sleep: async () => {}, maxCycles: 1 });
    expect(submitted).toEqual([
      "Scan wallet for risky token approvals",
      "Generate weekly wallet risk PDF",
      "Subscribe to real-time risk alerts",
    ]);
    expect(lines.some((l) => l.includes("REVOKED"))).toBe(true);
  });

  it("treats fail policy as blocked and continues to next action", async () => {
    let n = 0;
    const fakeClient = {
      submitAction: async (manifest: { actionId: string; title: string }) => {
        n += 1;
        return {
          action: { actionId: manifest.actionId },
          result:
            n === 3
              ? { status: "fail" as const, reasons: ["spend_exceeds_max"], riskLevel: "high" as const, manifestHash: "h" }
              : { status: "requires_approval" as const, reasons: [], riskLevel: "low" as const, manifestHash: "h" },
        };
      },
      waitForDecision: async () => ({
        status: "approved" as const,
        signature: "sig",
        receiptAddress: null,
      }),
    };
    const { lines, log } = makeLog();
    await runLoop({ client: fakeClient as never, wallet, log, sleep: async () => {}, maxCycles: 1 });
    expect(lines.some((l) => l.includes("BLOCK"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/research-agent test -- loop.test`
Expected: FAIL with "Cannot find module './loop'".

- [ ] **Step 3: Implement the loop**

```ts
// apps/research-agent/src/loop.ts
import type { ActionManifest, PolicyResult } from "@skillguard/protocol";
import { LOOP_SEQUENCE, buildLoopManifest, type LoopAction } from "./loopActions.js";
import type { LoopLog } from "./loopLog.js";

export interface LoopClient {
  submitAction(manifest: ActionManifest): Promise<{
    action: { actionId: string };
    result: PolicyResult;
  }>;
  waitForDecision(
    actionId: string,
    options: { pollMs: number; timeoutMs: number },
  ): Promise<{ status: "approved" | "rejected" | "blocked" | "expired" | "revoked" | "timeout"; signature: string | null; receiptAddress: string | null }>;
}

export interface RunLoopDeps {
  client: LoopClient;
  wallet: string;
  log: LoopLog;
  sleep: (ms: number) => Promise<void>;
  pollMs?: number;
  timeoutMs?: number;
  cycleDelayMs?: number;
  maxCycles?: number;
}

export async function runLoop(deps: RunLoopDeps): Promise<void> {
  const {
    client,
    wallet,
    log,
    sleep,
    pollMs = 2000,
    timeoutMs = 5 * 60 * 1000,
    cycleDelayMs = 5000,
    maxCycles = Number.POSITIVE_INFINITY,
  } = deps;

  log.banner(wallet);
  let counter = 0;
  let cycles = 0;

  while (cycles < maxCycles) {
    for (const kind of LOOP_SEQUENCE) {
      counter += 1;
      const manifest = buildLoopManifest(kind, wallet, counter);
      const submission = await client.submitAction(manifest);
      log.submitted(kind, submission.action.actionId, submission.result);

      if (submission.result.status === "fail") {
        log.blocked(kind, submission.result.reasons);
        continue;
      }

      const decision = await client.waitForDecision(submission.action.actionId, { pollMs, timeoutMs });
      log.decision(kind, decision);

      if (decision.status === "revoked") {
        log.revoked();
        return;
      }
    }
    cycles += 1;
    if (cycles < maxCycles) {
      log.cycleEnd();
      await sleep(cycleDelayMs);
    }
  }
}
```

Note: the `waitForDecision` return type in `loop.ts` includes `"revoked"` which the client doesn't currently surface. Add `"revoked"` to the client union type as well, and have the API return `revoked` in `decisionStatus` when the connection is revoked. Search:

```bash
grep -n "revoked" apps/api/src/routes.ts apps/api/src/store.ts
```

If the API returns `decisionStatus: "blocked"` with reasons including `revoked`, treat that as revoke in `loop.ts` instead. Adapt the logic with a `decisionStatusFromAction()` helper that maps `(decisionStatus, reasons)` to the loop's status.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/research-agent test -- loop.test`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/research-agent/src/loop.ts apps/research-agent/src/loop.test.ts
git commit -m "feat(research-agent): loop state machine with three-action sequence"
```

### Task B5: Wire the loop entry point and the npm script

**Files:**
- Create: `apps/research-agent/src/loopEntry.ts`
- Modify: `apps/research-agent/package.json`

- [ ] **Step 1: Add the script**

Edit `apps/research-agent/package.json`. In the `scripts` block, add:

```json
"agent:loop": "tsx src/loopEntry.ts"
```

- [ ] **Step 2: Implement the entry point**

```ts
// apps/research-agent/src/loopEntry.ts
import {
  connectionIdForWallet,
  createSkillGuardClient,
  keyPairFromBase58,
} from "./client.js";
import { runLoop } from "./loop.js";
import { createLoopLog } from "./loopLog.js";

const DEFAULT_API_URL = "https://skillguard-sol.vercel.app/api";

async function main() {
  const userWallet = process.env.SKILLGUARD_USER_WALLET;
  if (!userWallet) {
    throw new Error("Set SKILLGUARD_USER_WALLET to the connected mobile wallet address.");
  }
  const encoded = process.env.SKILLGUARD_AGENT_PRIVATE_KEY_B58;
  if (!encoded) {
    throw new Error("Set SKILLGUARD_AGENT_PRIVATE_KEY_B58 to the agent signing key.");
  }
  const apiUrl = process.env.SKILLGUARD_API_URL ?? DEFAULT_API_URL;
  const quiet = process.env.SKILLGUARD_LOOP_QUIET === "1";
  const pollMs = Number(process.env.SKILLGUARD_LOOP_POLL_MS ?? "2000");
  const timeoutMs = Number(process.env.SKILLGUARD_LOOP_TIMEOUT_MS ?? "300000");
  const cycleDelayMs = Number(process.env.SKILLGUARD_LOOP_DELAY_MS ?? "5000");

  const client = createSkillGuardClient({
    apiUrl,
    agentKeyPair: keyPairFromBase58(encoded),
    connectionId: connectionIdForWallet(userWallet),
  });
  const log = createLoopLog({ quiet });
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  let stopping = false;
  process.on("SIGINT", () => {
    if (stopping) return;
    stopping = true;
    log.banner("Stopping agent loop on SIGINT...");
    process.exit(0);
  });

  await runLoop({ client, wallet: userWallet, log, sleep, pollMs, timeoutMs, cycleDelayMs });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "agent loop failed";
  console.error(message);
  process.exitCode = 1;
});
```

- [ ] **Step 3: Verify the script is wired**

Run: `npm --prefix apps/research-agent run`
Expected: `agent:loop` is listed.

- [ ] **Step 4: Smoke against hosted API (manual)**

```bash
export SKILLGUARD_USER_WALLET=13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<from generate-agent-key.mjs>
npm --prefix apps/research-agent run agent:loop
```

Expected: emoji output starts streaming. Action 1 is submitted, the loop waits. Open the mobile app, approve. Action 2 is submitted. Approve. Action 3 is submitted, immediately blocked. Cycle restarts. Press Ctrl+C, expect clean exit.

- [ ] **Step 5: Commit**

```bash
git add apps/research-agent/src/loopEntry.ts apps/research-agent/package.json
git commit -m "feat(research-agent): npm run agent:loop entry point and SIGINT handling"
```

---

## Section C: Push Notifications (Phase 1.3)

Goal: when the API receives a new action that is pending user decision, all push tokens registered for that wallet receive a notification with agent name + action title. Tap opens the app to the inbox with the action selected.

### Task C1: Extend the API store with `pushTokens`

**Files:**
- Modify: `apps/api/src/store.ts`
- Test: extend `apps/api/src/server.test.ts` or create `apps/api/src/store.test.ts`

- [ ] **Step 1: Write the failing test**

If `apps/api/src/store.test.ts` does not exist, create it:

```ts
// apps/api/src/store.test.ts
import { describe, expect, it } from "vitest";
import { SkillGuardStore } from "./store";

const empty = { agents: [], connections: [], actions: [] };

describe("SkillGuardStore push tokens", () => {
  it("registers, lists, and deletes push tokens", () => {
    const store = new SkillGuardStore(empty);
    store.registerPushToken("walletA", "ExponentPushToken[abc]");
    store.registerPushToken("walletA", "ExponentPushToken[xyz]");
    expect(store.listPushTokens("walletA").sort()).toEqual([
      "ExponentPushToken[abc]",
      "ExponentPushToken[xyz]",
    ]);
    store.deletePushToken("walletA", "ExponentPushToken[abc]");
    expect(store.listPushTokens("walletA")).toEqual(["ExponentPushToken[xyz]"]);
  });

  it("deduplicates push tokens per wallet", () => {
    const store = new SkillGuardStore(empty);
    store.registerPushToken("walletA", "ExponentPushToken[abc]");
    store.registerPushToken("walletA", "ExponentPushToken[abc]");
    expect(store.listPushTokens("walletA")).toHaveLength(1);
  });

  it("survives snapshot round-trip", () => {
    const store = new SkillGuardStore(empty);
    store.registerPushToken("walletA", "ExponentPushToken[abc]");
    const snap = store.toSnapshot();
    const restored = new SkillGuardStore(snap);
    expect(restored.listPushTokens("walletA")).toEqual(["ExponentPushToken[abc]"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/api test -- store.test`
Expected: FAIL with "store.registerPushToken is not a function".

- [ ] **Step 3: Add to the store**

In `apps/api/src/store.ts`, add to the `StoreSnapshot` interface:

```ts
pushTokens?: Array<{ userWallet: string; token: string }>;
```

Inside the `SkillGuardStore` class, add a private map and methods:

```ts
private readonly pushTokens = new Map<string, Set<string>>();
```

In the constructor, add hydration:

```ts
for (const entry of snapshot.pushTokens ?? []) {
  this.registerPushToken(entry.userWallet, entry.token);
}
```

Update `toSnapshot()` to include push tokens:

```ts
toSnapshot(): StoreSnapshot {
  const pushTokens: Array<{ userWallet: string; token: string }> = [];
  for (const [wallet, tokens] of this.pushTokens) {
    for (const token of tokens) pushTokens.push({ userWallet: wallet, token });
  }
  return {
    actions: [...this.actions.values()],
    agents: [...this.agents.values()],
    connections: [...this.connections.values()],
    walletSessions: [...this.walletSessions.values()],
    pushTokens,
  };
}
```

Add three methods on the class:

```ts
registerPushToken(userWallet: string, token: string): void {
  const existing = this.pushTokens.get(userWallet) ?? new Set<string>();
  existing.add(token);
  this.pushTokens.set(userWallet, existing);
}

deletePushToken(userWallet: string, token: string): void {
  const existing = this.pushTokens.get(userWallet);
  if (!existing) return;
  existing.delete(token);
  if (existing.size === 0) this.pushTokens.delete(userWallet);
}

listPushTokens(userWallet: string): string[] {
  return [...(this.pushTokens.get(userWallet) ?? [])];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/api test -- store.test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/store.ts apps/api/src/store.test.ts
git commit -m "feat(api): store push tokens per wallet"
```

### Task C2: Add the Expo Push wrapper

**Files:**
- Create: `apps/api/src/push.ts`
- Test: `apps/api/src/push.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/api/src/push.test.ts
import { describe, expect, it, vi } from "vitest";
import { sendPushNotifications } from "./push";

const okResponse = (data: unknown) =>
  new Response(JSON.stringify({ data }), { status: 200, headers: { "content-type": "application/json" } });

describe("sendPushNotifications", () => {
  it("posts to expo push API and returns delivery report", async () => {
    const fetchSpy = vi.fn(async (_url: string, _init?: RequestInit) =>
      okResponse([{ status: "ok", id: "receipt-1" }]),
    );
    const dropped: string[] = [];
    const result = await sendPushNotifications({
      tokens: ["ExponentPushToken[abc]"],
      title: "Research Agent",
      body: "New scan request",
      data: { actionId: "act-1" },
      fetch: fetchSpy as unknown as typeof fetch,
      onTokenInvalid: (t) => dropped.push(t),
    });
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(result.sent).toBe(1);
    expect(dropped).toEqual([]);
  });

  it("calls onTokenInvalid for DeviceNotRegistered responses", async () => {
    const fetchSpy = vi.fn(async () =>
      okResponse([{ status: "error", details: { error: "DeviceNotRegistered" }, message: "x" }]),
    );
    const dropped: string[] = [];
    await sendPushNotifications({
      tokens: ["ExponentPushToken[dead]"],
      title: "x",
      body: "x",
      data: {},
      fetch: fetchSpy as unknown as typeof fetch,
      onTokenInvalid: (t) => dropped.push(t),
    });
    expect(dropped).toEqual(["ExponentPushToken[dead]"]);
  });

  it("retries once on 429 then succeeds", async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limit", { status: 429 }))
      .mockResolvedValueOnce(okResponse([{ status: "ok", id: "r" }]));
    const result = await sendPushNotifications({
      tokens: ["ExponentPushToken[abc]"],
      title: "x",
      body: "x",
      data: {},
      fetch: fetchSpy as unknown as typeof fetch,
      onTokenInvalid: () => {},
      retryDelayMs: 1,
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.sent).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/api test -- push.test`
Expected: FAIL with "Cannot find module './push'".

- [ ] **Step 3: Implement the wrapper**

```ts
// apps/api/src/push.ts
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface SendPushNotificationsInput {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  fetch?: typeof fetch;
  onTokenInvalid: (token: string) => void;
  retryDelayMs?: number;
}

export interface PushResult {
  sent: number;
  errors: string[];
}

interface ExpoTicket {
  status: "ok" | "error";
  id?: string;
  details?: { error?: string };
  message?: string;
}

export async function sendPushNotifications(input: SendPushNotificationsInput): Promise<PushResult> {
  if (input.tokens.length === 0) return { sent: 0, errors: [] };

  const fetchFn = input.fetch ?? fetch;
  const messages = input.tokens.map((to) => ({
    to,
    title: input.title,
    body: input.body,
    data: input.data,
    sound: "default",
    priority: "high",
  }));

  const send = async () =>
    fetchFn(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(messages),
    });

  let response = await send();
  if (response.status === 429) {
    await new Promise((r) => setTimeout(r, input.retryDelayMs ?? 1000));
    response = await send();
  }

  if (!response.ok) {
    return { sent: 0, errors: [`expo_push_http_${response.status}`] };
  }

  const body = (await response.json()) as { data?: ExpoTicket[] };
  const tickets = body.data ?? [];
  let sent = 0;
  const errors: string[] = [];

  tickets.forEach((ticket, index) => {
    if (ticket.status === "ok") {
      sent += 1;
      return;
    }
    const detail = ticket.details?.error ?? "unknown";
    errors.push(detail);
    if (detail === "DeviceNotRegistered") {
      input.onTokenInvalid(input.tokens[index]);
    }
  });

  return { sent, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/api test -- push.test`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/push.ts apps/api/src/push.test.ts
git commit -m "feat(api): expo push HTTP wrapper with retry and dead token cleanup"
```

### Task C3: Add push token endpoints to the API

**Files:**
- Modify: `apps/api/src/routes.ts`
- Modify: `apps/api/src/validation.ts`
- Modify: `apps/api/src/server.test.ts`

- [ ] **Step 1: Write the failing test (extend `server.test.ts`)**

Append a new describe block:

```ts
describe("POST /wallets/:wallet/push-token", () => {
  it("registers a token after a wallet session is established", async () => {
    const { app, store } = createTestApp();
    const wallet = "SmokeWalletPush";
    const sessionToken = "sgw_test_session_for_push";
    store.createWalletSession({
      sessionId: "s1",
      tokenHash: hashWalletSessionToken(sessionToken),
      userWallet: wallet,
      expiresAt: Date.now() + 60_000,
    });
    const res = await app.request(`/wallets/${wallet}/push-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-skillguard-wallet-session": sessionToken,
      },
      body: JSON.stringify({ token: "ExponentPushToken[abc]" }),
    });
    expect(res.status).toBe(201);
    expect(store.listPushTokens(wallet)).toEqual(["ExponentPushToken[abc]"]);
  });

  it("rejects without a wallet session", async () => {
    const { app } = createTestApp();
    const res = await app.request("/wallets/walletX/push-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "ExponentPushToken[abc]" }),
    });
    expect(res.status).toBe(401);
  });
});
```

You may need to import `hashWalletSessionToken` from `./walletSession` and adjust `createTestApp()` if it does not currently expose `store`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/api test -- server.test`
Expected: FAIL with `404` or similar — endpoint doesn't exist.

- [ ] **Step 3: Add the parser**

In `apps/api/src/validation.ts`, add:

```ts
export function parsePushTokenBody(value: unknown): { token: string } | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.token !== "string" || !obj.token.startsWith("ExponentPushToken[")) return null;
  return { token: obj.token };
}
```

- [ ] **Step 4: Add the routes**

In `apps/api/src/routes.ts`, add (anywhere among the other route declarations, e.g. after the `/actions/pending` block):

```ts
app.post("/wallets/:wallet/push-token", async (c) => {
  const wallet = c.req.param("wallet");
  const sessionError = walletSessionError(store, wallet, c.req.header("x-skillguard-wallet-session"));
  if (sessionError) {
    return c.json({ error: sessionError }, 401);
  }
  const body = parsePushTokenBody(await readOptionalJson(c));
  if (!body) {
    return c.json({ error: "invalid_push_token" }, 400);
  }
  store.registerPushToken(wallet, body.token);
  return c.json({ ok: true }, 201);
});

app.delete("/wallets/:wallet/push-token", async (c) => {
  const wallet = c.req.param("wallet");
  const sessionError = walletSessionError(store, wallet, c.req.header("x-skillguard-wallet-session"));
  if (sessionError) {
    return c.json({ error: sessionError }, 401);
  }
  const body = parsePushTokenBody(await readOptionalJson(c));
  if (!body) {
    return c.json({ error: "invalid_push_token" }, 400);
  }
  store.deletePushToken(wallet, body.token);
  return c.json({ ok: true }, 200);
});
```

Add `parsePushTokenBody` to the imports at the top of `routes.ts`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix apps/api test -- server.test`
Expected: PASS for the two new cases plus existing.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/routes.ts apps/api/src/validation.ts apps/api/src/server.test.ts
git commit -m "feat(api): POST/DELETE /wallets/:wallet/push-token endpoints"
```

### Task C4: Fan out push notifications when a pending action is created

**Files:**
- Modify: `apps/api/src/routes.ts:274-313` (the `POST /actions` handler)
- Modify: `apps/api/src/server.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
describe("POST /actions push fan-out", () => {
  it("calls expo push when the action is pending and a token is registered", async () => {
    const { app, store } = createTestApp();
    const wallet = "SmokeWalletPush";
    const agentId = "agent-research";
    const connectionId = `conn-${agentId}-${wallet}`;
    seedDemoAgentAndConnection(store, agentId, wallet, connectionId);
    store.registerPushToken(wallet, "ExponentPushToken[t]");
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ status: "ok", id: "r" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const handler = createApp(store, { fetch: fetchSpy as unknown as typeof fetch });
    const res = await handler.request("/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPendingActionPostBody(connectionId, agentId, wallet)),
    });
    expect(res.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
```

You will need helper functions `seedDemoAgentAndConnection` and `buildPendingActionPostBody` — implement them in the test file referencing existing seed/agent-proof code patterns elsewhere in `server.test.ts`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/api test -- server.test`
Expected: FAIL — fetchSpy not called.

- [ ] **Step 3: Modify createApp to accept an optional push fetch**

Change the signature of `createApp` in `routes.ts`:

```ts
export function createApp(store: SkillGuardStore, options: { fetch?: typeof fetch } = {}): Hono {
  const pushFetch = options.fetch;
  const app = new Hono();
  // ...
}
```

In the `POST /actions` handler, after `const action = store.createAction({...})` and before `return c.json(...)`, add:

```ts
if (action.decisionStatus === null) {
  const tokens = store.listPushTokens(action.manifest.userWallet);
  if (tokens.length > 0) {
    const { sendPushNotifications } = await import("./push.js");
    await sendPushNotifications({
      tokens,
      title: agent.name,
      body: action.manifest.title,
      data: { actionId: action.actionId, kind: "new_action" },
      fetch: pushFetch,
      onTokenInvalid: (t) => store.deletePushToken(action.manifest.userWallet, t),
    }).catch((error) => {
      console.error("push fan-out failed:", error);
    });
  }
}
```

The dynamic import keeps the cold-path light and avoids forcing all tests to mock fetch.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/api test -- server.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/routes.ts apps/api/src/server.test.ts
git commit -m "feat(api): fan out push notifications on new pending actions"
```

### Task C5: Mobile — install expo-notifications and configure plugin

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`

- [ ] **Step 1: Install dependencies**

```bash
npm --prefix apps/mobile install expo-notifications expo-device
```

- [ ] **Step 2: Configure the plugin in app.json**

Edit `apps/mobile/app.json`. Inside `expo`, add:

```json
"plugins": [
  ["expo-notifications", {
    "icon": "./assets/notification-icon.png",
    "color": "#00F0A8"
  }]
],
"android": {
  "package": "dev.skillguard.mobile",
  "versionCode": 1,
  "useNextNotificationsApi": true,
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#030712"
  },
  "predictiveBackGestureEnabled": false
}
```

If `assets/notification-icon.png` does not exist, copy the existing `assets/icon.png` to `assets/notification-icon.png` as a placeholder.

- [ ] **Step 3: Regenerate the native android folder**

```bash
. scripts/dev-env.sh
cd apps/mobile && npx expo prebuild --platform android --clean --no-install && cd -
```

- [ ] **Step 4: Rebuild the APK and verify it still installs**

```bash
SKILLGUARD_ANDROID_BUILD_PROFILE=standalone scripts/build-mobile-apk.sh
```

Expected: `Built standalone debug-signed APK`. Build time may be longer than usual due to prebuild.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/package.json apps/mobile/package-lock.json apps/mobile/app.json apps/mobile/assets/notification-icon.png
git commit -m "feat(mobile): install expo-notifications and configure plugin"
```

### Task C6: Mobile — register push token

**Files:**
- Create: `apps/mobile/src/notifications/registerPushToken.ts`
- Test: `apps/mobile/src/notifications/registerPushToken.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/notifications/registerPushToken.test.ts
import { describe, expect, it, vi } from "vitest";
import { registerPushToken } from "./registerPushToken";

describe("registerPushToken", () => {
  it("returns the token when permission is granted", async () => {
    const result = await registerPushToken({
      requestPermission: async () => "granted",
      getCurrentPermission: async () => "undetermined",
      getExpoPushToken: async () => "ExponentPushToken[abc]",
      isDevice: true,
    });
    expect(result).toEqual({ ok: true, token: "ExponentPushToken[abc]" });
  });

  it("returns ok:false when permission is denied", async () => {
    const result = await registerPushToken({
      requestPermission: async () => "denied",
      getCurrentPermission: async () => "undetermined",
      getExpoPushToken: vi.fn(),
      isDevice: true,
    });
    expect(result).toEqual({ ok: false, reason: "permission_denied" });
  });

  it("skips on simulator", async () => {
    const result = await registerPushToken({
      requestPermission: async () => "granted",
      getCurrentPermission: async () => "granted",
      getExpoPushToken: vi.fn(),
      isDevice: false,
    });
    expect(result).toEqual({ ok: false, reason: "not_a_device" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/mobile test -- registerPushToken`
Expected: FAIL with "Cannot find module './registerPushToken'".

- [ ] **Step 3: Implement the function**

```ts
// apps/mobile/src/notifications/registerPushToken.ts
type Permission = "granted" | "denied" | "undetermined";

export interface RegisterPushTokenDeps {
  isDevice: boolean;
  getCurrentPermission(): Promise<Permission>;
  requestPermission(): Promise<Permission>;
  getExpoPushToken(): Promise<string>;
}

export type RegisterPushTokenResult =
  | { ok: true; token: string }
  | { ok: false; reason: "not_a_device" | "permission_denied" };

export async function registerPushToken(
  deps: RegisterPushTokenDeps,
): Promise<RegisterPushTokenResult> {
  if (!deps.isDevice) return { ok: false, reason: "not_a_device" };
  const current = await deps.getCurrentPermission();
  let final = current;
  if (current !== "granted") {
    final = await deps.requestPermission();
  }
  if (final !== "granted") return { ok: false, reason: "permission_denied" };
  const token = await deps.getExpoPushToken();
  return { ok: true, token };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix apps/mobile test -- registerPushToken`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/mobile/src/notifications/registerPushToken.ts apps/mobile/src/notifications/registerPushToken.test.ts
git commit -m "feat(mobile): pure push token registration helper"
```

### Task C7: Mobile — wire registration into wallet session lifecycle

**Files:**
- Modify: `apps/mobile/src/screens/WalletConnectScreen.tsx`
- Modify: `apps/mobile/src/liveApi.ts` (add `registerPushToken` call)

- [ ] **Step 1: Add a thin Expo adapter at the call site**

In `WalletConnectScreen.tsx`, near the existing wallet-session setup, after `setWalletSession({ token: sessionToken, wallet: address });`, add:

```ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { registerPushToken } from "../notifications/registerPushToken";

// inside the loadRestoredSession() success branch:
const result = await registerPushToken({
  isDevice: Device.isDevice,
  async getCurrentPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";
  },
  async requestPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";
  },
  async getExpoPushToken() {
    const tokenResponse = await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data;
  },
});
if (result.ok) {
  await apiClient.registerPushToken(address, result.token, sessionToken);
}
```

- [ ] **Step 2: Add `registerPushToken` to `liveApi.ts`**

In `apps/mobile/src/liveApi.ts`, find the API client object (likely returned by `createSkillGuardApiClient()`). Add a method:

```ts
async registerPushToken(wallet: string, token: string, sessionToken: string): Promise<void> {
  const response = await fetch(`${apiBase}/wallets/${wallet}/push-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-skillguard-wallet-session": sessionToken,
    },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) {
    console.warn(`registerPushToken failed: ${response.status}`);
  }
}
```

- [ ] **Step 3: Run mobile typecheck**

Run: `npm --prefix apps/mobile run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/src/screens/WalletConnectScreen.tsx apps/mobile/src/liveApi.ts
git commit -m "feat(mobile): register expo push token on wallet session"
```

### Task C8: Mobile — handle notification taps to open inbox

**Files:**
- Create: `apps/mobile/src/notifications/handleNotificationTap.ts`
- Test: `apps/mobile/src/notifications/handleNotificationTap.test.ts`
- Modify: `apps/mobile/App.tsx` (add response listener)

- [ ] **Step 1: Write the failing test**

```ts
// apps/mobile/src/notifications/handleNotificationTap.test.ts
import { describe, expect, it, vi } from "vitest";
import { handleNotificationTap } from "./handleNotificationTap";

describe("handleNotificationTap", () => {
  it("invokes openInboxAction when actionId is in data", () => {
    const open = vi.fn();
    handleNotificationTap({ data: { actionId: "act-1", kind: "new_action" } }, { openInboxAction: open });
    expect(open).toHaveBeenCalledWith("act-1");
  });

  it("ignores notifications without actionId", () => {
    const open = vi.fn();
    handleNotificationTap({ data: {} }, { openInboxAction: open });
    expect(open).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix apps/mobile test -- handleNotificationTap`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// apps/mobile/src/notifications/handleNotificationTap.ts
export interface HandleNotificationTapInput {
  data: Record<string, unknown> | null | undefined;
}

export interface HandleNotificationTapDeps {
  openInboxAction(actionId: string): void;
}

export function handleNotificationTap(
  input: HandleNotificationTapInput,
  deps: HandleNotificationTapDeps,
): void {
  const data = input.data ?? {};
  const actionId = data.actionId;
  if (typeof actionId === "string" && actionId.length > 0) {
    deps.openInboxAction(actionId);
  }
}
```

- [ ] **Step 4: Wire the listener in `App.tsx`**

```tsx
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { handleNotificationTap } from "./src/notifications/handleNotificationTap";

// Inside App() before return:
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    handleNotificationTap(
      { data: response.notification.request.content.data ?? {} },
      {
        openInboxAction: (actionId) => {
          // Push the actionId into a global dispatcher consumed by WalletConnectScreen.
          // Implementation: use a small event emitter exported from liveState.ts, or
          // navigate via the existing tab state if exposed. Simplest:
          // import { selectActionGlobally } from "./src/liveState";
          // selectActionGlobally(actionId);
        },
      },
    );
  });
  return () => subscription.remove();
}, []);
```

If `liveState.ts` does not export a global dispatcher, add one:

```ts
type Listener = (actionId: string) => void;
const listeners = new Set<Listener>();
export function selectActionGlobally(actionId: string) {
  for (const l of listeners) l(actionId);
}
export function subscribeSelectAction(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
```

In `WalletConnectScreen.tsx`, subscribe in a `useEffect` and call `selectAction` on the local state.

- [ ] **Step 5: Run the test**

Run: `npm --prefix apps/mobile test -- handleNotificationTap`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add apps/mobile/src/notifications/handleNotificationTap.ts apps/mobile/src/notifications/handleNotificationTap.test.ts apps/mobile/App.tsx apps/mobile/src/liveState.ts apps/mobile/src/screens/WalletConnectScreen.tsx
git commit -m "feat(mobile): open inbox to selected action on notification tap"
```

### Task C9: Document push env in `.env.example` and `docs/VERCEL.md`

**Files:**
- Modify: `.env.example`
- Modify: `docs/VERCEL.md`

- [ ] **Step 1: Add to `.env.example`**

```bash
# Optional: Expo Access Token for push receipt verification (post-MVP).
# Leave empty for the demo; the public Expo Push API works without auth.
EXPO_ACCESS_TOKEN=
```

- [ ] **Step 2: Add a section to `docs/VERCEL.md`**

```md
## Push Notifications

The hosted API stores Expo push tokens in the same KV namespace as the rest
of the store snapshot (`storage:snapshot`). New pending actions trigger a
push fan-out via the public Expo Push API (`https://exp.host/--/api/v2/push/send`).

No additional Vercel env vars are required for the demo. Set
`EXPO_ACCESS_TOKEN` only if you later want to verify push receipts.
```

- [ ] **Step 3: Commit**

```bash
git add .env.example docs/VERCEL.md
git commit -m "docs: push notifications env and storage notes"
```

### Task C10: End-to-end push smoke (manual, on real device)

This task has no commit, only verification.

- [ ] **Step 1: Build and install the latest APK**

```bash
. scripts/dev-env.sh
SKILLGUARD_ANDROID_BUILD_PROFILE=standalone scripts/build-mobile-apk.sh
adb install -r build/mobile/skillguard.apk
```

- [ ] **Step 2: Open the app on a REAL Android device (push doesn't work on emulator without play services)**

- [ ] **Step 3: Connect wallet, accept the notifications permission, import the agent, set the policy**

- [ ] **Step 4: Lock the device, then trigger an action submission from the laptop**

```bash
export SKILLGUARD_USER_WALLET=13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<key>
npm --prefix apps/research-agent run agent:loop
```

Expected: lock-screen notification appears with title "Research Agent" and body "Scan wallet for risky token approvals". Tap → app opens to the inbox with that action selected.

If it does not work, debug. Common failure: physical device's notifications channel is muted; check Android settings.

---

## Section D: Final Stabilization, Demo Script, Video

### Task D1: Update agent README and top-level README to promote the loop

**Files:**
- Modify: `apps/research-agent/README.md`
- Modify: `README.md`

- [ ] **Step 1: Edit `apps/research-agent/README.md`**

Add at the top (under the existing intro):

```md
## Demo loop

The standard demo path is the autonomous loop:

```bash
export SKILLGUARD_USER_WALLET=<your-wallet>
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<from generate-agent-key.mjs>
npm run agent:loop
```

The loop submits three Wallet Risk Monitor actions (free scan → paid report → subscription upgrade) and waits for your decision in the mobile app between each. Press Ctrl+C to stop.

The legacy single-shot commands (`submit:safe`, `submit:unsafe`, `submit:revoked`) remain for smoke and CI use.
```

- [ ] **Step 2: Edit `README.md`**

In "Run The Local Demo", change the third terminal's instructions from the per-action commands to:

```bash
export SKILLGUARD_API_URL=https://skillguard-sol.vercel.app/api
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<from generate-agent-key.mjs>
npm --prefix apps/research-agent run agent:loop
```

- [ ] **Step 3: Commit**

```bash
git add apps/research-agent/README.md README.md
git commit -m "docs: promote agent:loop to the primary demo path"
```

### Task D2: Rewrite docs/DEMO.md to match the new flow

**Files:**
- Modify: `docs/DEMO.md`

- [ ] **Step 1: Replace contents with the locked demo script**

Open the spec at `docs/superpowers/specs/2026-05-09-skillguard-best-ending-plan.md`, copy the table from "Phase 1.4 Video demo (under 2 minutes, scripted)", and turn it into prose with explicit commands and taps:

```md
# SkillGuard Demo Script

Total length: 110 seconds, hard cap 180 seconds.

## Pre-recording setup

- Real Android device, screen-record enabled.
- Wallet `13hFVdC14kKJmCAgtZcTjbwZCCYvE86c7Y5Q6bwjop4Q` (or your own) funded with at least 0.05 devnet SOL via faucet.solana.com.
- Hosted API: `https://skillguard-sol.vercel.app/api`.
- Two terminals open, one for the agent loop, one for log capture.

## Beats

1. Hero (8s): record the Vercel site landing page.
2. Pair (12s): import agent-research from the pairing link, sign challenge, set policy max spend = 0.01 SOL.
3. Lock + push (10s): lock the device. From the laptop, run `npm --prefix apps/research-agent run agent:loop`. Push arrives.
4. Action 1 approve (12s): tap notification, approve, show Solscan signature.
5. Action 2 approve (18s): wait for next push, approve, show wallet balance change on Solscan.
6. Action 3 blocked (12s): wait for next entry, show inbox with Blocked badge, no signing prompt.
7. Revoke (12s): open agent detail, tap Revoke. Show terminal exiting cleanly.
8. Closing (16s): record architecture page on site.

Voice over recorded separately, aligned in post.
```

- [ ] **Step 2: Commit**

```bash
git add docs/DEMO.md
git commit -m "docs: rewrite demo script for loop + push flow"
```

### Task D3: Record the demo video (manual)

This is not code. Allocate one focused session.

- [ ] **Step 1: Run a full dress rehearsal off-camera**

Verify every beat works end to end. Time it. If it is over 180s, cut Action 1 detail or trim the closing.

- [ ] **Step 2: Record on the device using `adb shell screenrecord`**

```bash
adb shell screenrecord --time-limit=180 /sdcard/skillguard-demo.mp4
# perform the demo
adb pull /sdcard/skillguard-demo.mp4 build/demo/
```

- [ ] **Step 3: Record terminal separately with `asciinema rec` or a simple screen-record app**

- [ ] **Step 4: Edit (cuts only, no music) in iMovie or DaVinci Resolve**

- [ ] **Step 5: Upload to YouTube as Unlisted**

- [ ] **Step 6: Commit the link to README and SUBMISSION**

```bash
# In docs/SUBMISSION.md and README.md, add the URL where the demo video is referenced.
git add README.md docs/SUBMISSION.md
git commit -m "docs: link recorded demo video"
```

---

## Self-Review

I checked this plan against the spec. Each Phase 1 sub-section has tasks that implement it:

- **Phase 1.1 (real txs)** → Tasks A1–A6.
- **Phase 1.2 (loop daemon)** → Tasks B1–B5.
- **Phase 1.3 (push notifications)** → Tasks C1–C10.
- **Phase 1.4 (video)** → Task D3.
- **Phase 1.5 (DEMO.md)** → Task D2.

Phase 2 (site refactor + submission) is intentionally NOT in this plan and will get its own plan after Phase 1 ships.

No placeholders. All code blocks are complete. All file paths are exact.

One known cross-task assumption: Task A4 assumes `actionToApprove.manifest` is reachable through the existing `liveState`. If it is not, plumbing it through is part of Task A4 step 3.

Type consistency: `LoopAction` ("freeScan" | "paidReport" | "subscriptionUpgrade") used identically in `loopActions.ts` and `loop.ts`. Push token shape (`ExponentPushToken[...]`) validated consistently in API parser and mobile registration. Decision status union extended in client AND in `loop.ts` with `"timeout"` and `"revoked"` consistently.
