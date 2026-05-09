import { describe, expect, it } from "vitest";

import { createLoopLogger, shortenAddress } from "./loopLog.js";

describe("research agent loop logger", () => {
  it("shortens wallet addresses for demo output", () => {
    expect(shortenAddress("Abcdefghijklmnop")).toBe("Abcd...mnop");
  });

  it("formats quiet log lines for stable tests", () => {
    const lines: string[] = [];
    const log = createLoopLogger({ quiet: true, write: (line) => lines.push(line) });

    log.banner("Wallet111111111111");
    log.submitted("freeScan", "action-1", "requires_approval", [
      "policy_requires_manual_approval",
    ]);
    log.decision("freeScan", "approved", "signature-1");
    log.blocked("subscriptionUpgrade", ["spend_exceeds_max", "overspend"]);
    log.cycleEnd(5000);

    expect(lines).toEqual([
      "[BANNER] Agent started, watching wallet Wall...1111",
      "[SUBMIT] freeScan action-1 policy=requires_approval reasons=policy_requires_manual_approval",
      "[OK] freeScan APPROVED signature=signature-1",
      "[BLOCK] subscriptionUpgrade BLOCKED reasons=spend_exceeds_max,overspend",
      "[CYCLE] Cycle complete. Restarting in 5000ms",
    ]);
  });
});
