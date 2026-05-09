import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("hosted live demo launcher", () => {
  it("opens the live pairing QR before starting the research-agent loop", () => {
    const script = readFileSync("scripts/live-demo.sh", "utf8");

    assert.match(script, /skillguard-sol\.vercel\.app\/api/);
    assert.match(script, /agent-research-live\.html/);
    assert.match(script, /HOME.*\.skillguard.*agent-research-live-230105\.env/);
    assert.match(script, /npm --prefix apps\/research-agent run agent:loop/);
    assert.doesNotMatch(script, /32wgoh6ToacrsYPK9PpVmLb8nx8iBApuKYDGG7zzk9M5jJaswDRc3xuaSKrFCE6Dk7DWuESEdnb7jsBHFrM9YHRf/);

    const waitIndex = script.indexOf("Press Enter after the mobile app shows the imported agent");
    const loopIndex = script.indexOf("npm --prefix apps/research-agent run agent:loop");
    assert.ok(waitIndex > -1, "script should wait for confirmed mobile pairing");
    assert.ok(loopIndex > waitIndex, "agent loop should start after the pairing wait");
  });
});
