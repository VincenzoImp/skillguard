import type { ActionManifest } from "@skillguard/protocol";

import type { SubmittedAction, WaitForDecisionResult } from "./client.js";
import { buildLoopManifest, LOOP_ACTION_SEQUENCE } from "./loopActions.js";
import { createLoopLogger, type LoopLogger } from "./loopLog.js";

export interface LoopClient {
  submitAction(manifest: ActionManifest): Promise<SubmittedAction>;
  waitForDecision(
    actionId: string,
    options: { pollMs: number; timeoutMs: number }
  ): Promise<WaitForDecisionResult>;
}

export interface RunLoopDeps {
  agentId?: string;
  client: LoopClient;
  cycleDelayMs?: number;
  decisionPollMs?: number;
  decisionTimeoutMs?: number;
  log?: LoopLogger | ((line: string) => void);
  maxCycles?: number;
  runId?: string;
  sleep: (ms: number) => Promise<void>;
  userWallet: string;
}

const DEFAULT_CYCLE_DELAY_MS = 5000;
const DEFAULT_DECISION_POLL_MS = 2000;
const DEFAULT_DECISION_TIMEOUT_MS = 5 * 60_000;

export async function runLoop({
  agentId,
  client,
  cycleDelayMs = DEFAULT_CYCLE_DELAY_MS,
  decisionPollMs = DEFAULT_DECISION_POLL_MS,
  decisionTimeoutMs = DEFAULT_DECISION_TIMEOUT_MS,
  log = createLoopLogger(),
  maxCycles,
  runId = String(Date.now()),
  sleep,
  userWallet,
}: RunLoopDeps): Promise<void> {
  const logger = typeof log === "function" ? createLoopLogger({ quiet: true, write: log }) : log;
  let counter = 0;
  let cycles = 0;

  logger.banner(userWallet);

  while (maxCycles === undefined || cycles < maxCycles) {
    for (const kind of LOOP_ACTION_SEQUENCE) {
      counter += 1;
      const manifest = buildLoopManifest(kind, { agentId, counter, runId, userWallet });
      const submission = await client.submitAction(manifest);
      logger.submitted(
        kind,
        submission.action.actionId,
        submission.result.status,
        submission.result.reasons
      );

      if (submission.result.status === "fail") {
        logger.blocked(kind, submission.result.reasons);
        if (submission.result.reasons.includes("policy_revoked")) {
          logger.revoked();
          return;
        }
        continue;
      }

      const decision = await client.waitForDecision(submission.action.actionId, {
        pollMs: decisionPollMs,
        timeoutMs: decisionTimeoutMs,
      });
      logger.decision(kind, decision.status, decision.action?.decisionStatus ?? null);
      if (decision.status === "revoked") {
        logger.revoked();
        return;
      }
    }

    cycles += 1;
    if (maxCycles !== undefined && cycles >= maxCycles) {
      return;
    }
    logger.cycleEnd(cycleDelayMs);
    await sleep(cycleDelayMs);
  }
}
