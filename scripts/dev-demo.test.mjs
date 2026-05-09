import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("local demo launcher", () => {
  it("promotes the autonomous research-agent loop as the default demo path", () => {
    const script = readFileSync("scripts/dev-demo.sh", "utf8");

    assert.match(script, /npm --prefix apps\/research-agent run agent:loop/);
    assert.match(script, /SKILLGUARD_AGENT_PRIVATE_KEY_B58/);
    assert.doesNotMatch(script, /SKILLGUARD_AUTORUN_AGENT[^]*submit:safe/);
    assert.doesNotMatch(script, /SKILLGUARD_AUTORUN_AGENT[^]*submit:unsafe/);
  });
});
