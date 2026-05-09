import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "demo-package/README.md",
  "demo-package/00-video-brief.md",
  "demo-package/01-voiceover-script.md",
  "demo-package/02-shot-list.md",
  "demo-package/03-visual-storyboard.md",
  "demo-package/04-app-recording-guide.md",
  "demo-package/05-html-presentation-spec.md",
  "demo-package/06-assets-map.md",
  "demo-package/07-final-export-checklist.md",
  "demo-package/prompts/html-video-agent-prompt.md",
  "demo-package/prompts/app-capture-agent-prompt.md",
  "demo-package/references/product-context.md",
  "demo-package/references/technical-proof.md",
  "demo-package/references/demo-flow.md",
];

describe("demo package", () => {
  it("contains the handoff files needed by an external video agent", () => {
    for (const file of requiredFiles) {
      assert.equal(existsSync(file), true, `${file} is missing`);
    }
  });

  it("centers the three-minute script on the agent wallet-firewall gap", () => {
    const script = readFileSync("demo-package/01-voiceover-script.md", "utf8");

    assert.match(script, /wallet firewall for AI agents/i);
    assert.match(script, /without handing them your wallet/i);
    assert.match(script, /Allow, Ask, or Block/i);
    assert.match(script, /0\.001 SOL/i);
    assert.match(script, /Solana devnet receipt/i);
  });

  it("tells the HTML video agent not to render voiceover subtitles", () => {
    const prompt = readFileSync("demo-package/prompts/html-video-agent-prompt.md", "utf8");

    assert.match(prompt, /Do not place the full voiceover on screen/i);
    assert.match(prompt, /micro-copy/i);
    assert.match(prompt, /picture-in-picture/i);
  });
});
