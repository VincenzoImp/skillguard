# Demo Agent Demo Loop — Design

Date: 2026-05-09
Status: Draft, ready for user review.

## Goal

Make `agent-research` feel real during the hackathon demo. Today the agent
is a CLI tool the operator must invoke per action. The demo needs an
autonomous loop that connects once, sends meaningful action requests on a
cadence, waits for the user's mobile decisions, and reacts to revocation.

## Non-goals

- Replacing the existing `submit:safe` / `submit:unsafe` / `submit:revoked`
  CLI commands. Smoke tests and `submission-check.sh` still rely on them.
- Real on-chain token transfers. The MVP records *decisions* on devnet, not
  the executed transfers. The "spend" amounts in manifests are nominal.
- Implementing new policy modes or new program instructions.

## User-facing flow during the demo

1. Operator imports `agent-research` from the mobile app via the existing
   pairing link, signs the wallet-owner challenge, and configures a policy
   with `maxSpendAtomic = 1000000` (1 USDC) so action 2 fits and action 3
   does not.
2. Operator runs `npm --prefix apps/research-agent run agent:loop` on the
   laptop. The terminal prints the agent's startup banner.
3. The mobile app's inbox receives Action 1 (free scan). Operator approves.
4. Inbox receives Action 2 (paid risk report, 0.10 USDC spend). Operator
   approves; receipt lands on devnet.
5. Inbox receives Action 3 (5 USDC subscription upgrade). The policy engine
   marks it `fail` for overspend before the mobile app even prompts. The app
   shows it as Blocked.
6. Loop sleeps 5s and restarts at Action 1. Operator can revoke from the
   app at any time. The next action submission returns `revoked`; the loop
   logs the event and exits cleanly.

## Architecture

New module: `apps/research-agent/src/loop.ts`. Pure orchestration. Reuses
`client.ts` for HTTP calls, `actions.ts` for manifest builders, and the
existing `@skillguard/protocol` fixtures.

```
apps/research-agent/src/
  loop.ts          NEW   state machine, polling, cycle log
  loop.test.ts     NEW   vitest unit test with mocked client
  loopLog.ts       NEW   pure formatting helpers (emoji + quiet mode)
  loopLog.test.ts  NEW   format snapshots
  actions.ts       EDIT  add three Wallet Risk Monitor manifest builders
  client.ts        EDIT  add waitForDecision(actionId, options)
  index.ts         KEEP  current CLI submit:* entry point
```

New script in `apps/research-agent/package.json`:

```json
"agent:loop": "tsx src/loopEntry.ts"
```

`loopEntry.ts` is a thin wrapper: parse env, construct client, call
`runLoop`. Keeping it separate from the loop function itself lets the
vitest test exercise `runLoop` without spawning a process.

## Manifest catalogue

Three Wallet Risk Monitor actions, all on `solana-devnet`,
`agentId: "agent-research"`, `protocols` and `spend` shaped to a clear narrative.

### Action 1: Free Wallet Scan

```ts
{
  kind: "wallet_risk_report",
  title: "Scan wallet for risky token approvals",
  summary:
    "Read-only check via Helius for suspicious SPL token approvals and dust attacks.",
  protocols: ["helius"],
  spend: [
    { mint: "USDC", amountAtomic: "0", human: "0 USDC", reason: "Read-only scan" },
  ],
  riskSignals: [
    { level: "low", code: "read_only", message: "No funds move." },
  ],
}
```

Expected outcome: `requires_approval` from policy engine, then `approved`
when the user taps Approve in the app.

### Action 2: Paid Risk Report

```ts
{
  kind: "wallet_risk_report",
  title: "Generate weekly wallet risk PDF",
  summary:
    "Pull tx history via Helius and price moves via Birdeye, output a signed risk report.",
  protocols: ["helius", "birdeye"],
  spend: [
    { mint: "USDC", amountAtomic: "100000", human: "0.10 USDC", reason: "API quota" },
  ],
  riskSignals: [
    { level: "low", code: "metered_read", message: "Spend below configured cap." },
  ],
}
```

Expected outcome: `requires_approval`, then `approved` if the user's policy
has `maxSpendAtomic >= 100000` and `allowedMints` includes USDC. The README
demo instructions tell the operator to set max spend = 1 USDC; this fits.

### Action 3: Subscription Upgrade (always blocked)

```ts
{
  kind: "swap_preview",
  title: "Subscribe to real-time risk alerts",
  summary:
    "Monthly subscription to push real-time alerts via Helius webhooks.",
  protocols: ["helius"],
  spend: [
    { mint: "USDC", amountAtomic: "5000000", human: "5.00 USDC", reason: "Monthly subscription" },
  ],
  riskSignals: [
    { level: "high", code: "overspend_subscription", message: "Above per-action cap." },
  ],
}
```

Expected outcome: `fail` from the policy engine on submit. Reasons include
`spend_exceeds_max`. Mobile never prompts; the inbox shows it as Blocked.

## State machine

```ts
type LoopAction = "freeScan" | "paidReport" | "subscriptionUpgrade";

const SEQUENCE: readonly LoopAction[] = [
  "freeScan",
  "paidReport",
  "subscriptionUpgrade",
];

async function runLoop(deps: LoopDeps) {
  const { client, wallet, log, sleep } = deps;
  let counter = 0;

  log.banner(wallet);

  while (true) {
    for (const kind of SEQUENCE) {
      counter += 1;
      const manifest = buildLoopManifest(kind, wallet, counter);
      const submission = await client.submitAction(manifest);

      log.submitted(kind, submission.action.actionId, submission.result);

      if (submission.result.status === "fail") {
        log.blocked(kind, submission.result.reasons);
        continue;
      }

      const decision = await client.waitForDecision(
        submission.action.actionId,
        { pollMs: 2000, timeoutMs: 5 * 60_000 },
      );

      log.decision(kind, decision);

      if (decision.status === "revoked") {
        log.revoked();
        return;
      }
    }

    log.cycleEnd();
    await sleep(5000);
  }
}
```

`LoopDeps` is the pure-injection seam: tests pass a fake `client`, `log`,
and `sleep`. `loopEntry.ts` passes the real implementations.

## Decision polling

Add `client.waitForDecision(actionId, { pollMs, timeoutMs })` in
`client.ts`. Implementation: loop calling `GET /api/actions/:id` every
`pollMs` milliseconds. Exit conditions:

- `status` enters `{ approved, rejected, blocked, revoked }` -> resolve
  with the full action record
- elapsed >= `timeoutMs` -> resolve with `{ status: "timeout" }` and the
  loop logs a warning and continues to the next action

`pollMs = 2000` and `timeoutMs = 300000` (5 minutes) are constants in
`loop.ts`, overridable via env for tests.

## Logging

Default mode prints emoji-tagged lines for demo readability:

```
🤖 Agent started, watching wallet 13hF...op4Q
→ submit freeScan (action-research-loop-1730481234-1)
  policy: requires_approval, awaiting user...
✅ freeScan APPROVED — receipt: 5xqK...8nB2
→ submit paidReport (action-research-loop-1730481234-2)
  policy: requires_approval, awaiting user...
✅ paidReport APPROVED — receipt: 7nBp...x4mZ
→ submit subscriptionUpgrade (action-research-loop-1730481234-3)
  policy: fail (overspend) — blocked before mobile
🔒 subscriptionUpgrade BLOCKED — reasons: [overspend, spend_exceeds_max]
↻ Cycle complete. Restarting in 5s...
```

`SKILLGUARD_LOOP_QUIET=1` swaps emojis for `[OK]`, `[BLOCK]`, `[REVOKED]`,
`[CYCLE]`, `[SUBMIT]`, `[BANNER]`. Tests run in quiet mode so console
snapshots are stable.

`shortenAddress(addr)` returns `addr.slice(0, 4) + "..." + addr.slice(-4)`.

## Action ID strategy

`action-research-loop-<startTimestamp>-<counter>` where:

- `startTimestamp` is recorded once when the loop starts (`Date.now()`)
- `counter` increments on every submission

This guarantees idempotency across loop restarts and avoids collisions
when the operator runs the loop twice in the same demo.

## Error handling

| Failure | Behavior |
|---|---|
| API unreachable on submit | 3 retries with exponential backoff (1s, 2s, 4s), then exit 1 with the underlying error message |
| `submitAction` returns `agent_not_connected` | Exit 1 with a one-line hint: "Import agent-research in the mobile app first." |
| `waitForDecision` times out | Log warning, skip to next action, keep looping |
| `waitForDecision` returns `revoked` | Log final message, exit 0 |
| `SIGINT` (Ctrl+C) | Trap signal, print "Stopping agent loop..." and exit 0 with no stack trace |

## Environment variables

Required:

- `SKILLGUARD_USER_WALLET` — connected mobile wallet address
- `SKILLGUARD_AGENT_PRIVATE_KEY_B58` — agent signing key

Optional, with defaults:

- `SKILLGUARD_API_URL` — default `https://skillguard-sol.vercel.app/api`
- `SKILLGUARD_LOOP_DELAY_MS` — default `5000`, sleep between cycles
- `SKILLGUARD_LOOP_POLL_MS` — default `2000`, decision poll cadence
- `SKILLGUARD_LOOP_TIMEOUT_MS` — default `300000`, per-action timeout
- `SKILLGUARD_LOOP_QUIET` — `1` to disable emojis

## Tests

`loop.test.ts` (vitest) covers:

1. Happy path: client returns `approved` for action 1, `approved` for
   action 2, `fail` (overspend) on submit for action 3. The loop performs
   one full cycle and stops when the test injects a fake `sleep` that
   throws on cycle 2.
2. Rejection: action 1 returns `rejected`. Loop logs and proceeds to
   action 2 in the same cycle.
3. Revocation: action 1 returns `revoked`. Loop logs revoke and resolves
   without entering action 2.
4. Submit failure with retry exhausted: client throws on every submit.
   Loop exits 1 with a deterministic error message.
5. Timeout: `waitForDecision` returns `{ status: "timeout" }`. Loop logs
   and continues.

`loopLog.test.ts` snapshots both quiet and emoji output for one example
of each event type. This locks the demo log format.

`actions.test.ts` extends to cover the three new manifest builders:
shape, amounts, and protocol/mint allowlist alignment with the policy
fixture.

## Documentation updates

- `apps/research-agent/README.md`: new section "Demo loop" describing
  `npm run agent:loop`, the three actions, and the expected outcomes.
- Top-level `README.md` "Run The Local Demo" subsection: append an
  alternative path that uses the loop instead of the manual `submit:*`
  commands.
- `docs/DEMO.md`: add the loop to the demo script, replacing the manual
  CLI invocations.

## Out of scope (deferred)

- Polling efficiency: the design uses HTTP polling. A WebSocket / SSE
  upgrade is a future improvement, not blocking demo.
- Multiple loop instances against the same wallet: the operator runs one
  loop. Two concurrent loops would interleave action IDs, which is
  technically fine but visually confusing.
- Persistent state: the loop is stateless across restarts. No need to
  remember which action came last; the cycle order is fixed.

## Open questions

None. Operator preferences captured: emoji logs default, sequential
strict-order loop, restart on cycle complete, exit on revoke, retain
existing CLI commands.
