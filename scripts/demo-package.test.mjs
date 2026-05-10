import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "demo-package/MASTER_BRIEF.md",
  "demo-package/README.md",
  "demo-package/00-video-brief.md",
  "demo-package/01-voiceover-script.md",
  "demo-package/02-shot-list.md",
  "demo-package/03-visual-storyboard.md",
  "demo-package/04-app-recording-guide.md",
  "demo-package/05-html-presentation-spec.md",
  "demo-package/06-assets-map.md",
  "demo-package/07-final-export-checklist.md",
  "demo-package/08-director-prompt.md",
  "demo-package/prompts/html-video-agent-prompt.md",
  "demo-package/prompts/app-capture-agent-prompt.md",
  "demo-package/references/style-and-components.md",
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
    assert.match(script, /wallet access without giving up control/i);
    assert.match(script, /Allow, Ask, Block, and Revoke/i);
    assert.match(script, /0\.001 SOL/i);
    assert.match(script, /Solana devnet receipt/i);
  });

  it("gives the video agent a focused director prompt", () => {
    const directorPrompt = readFileSync("demo-package/08-director-prompt.md", "utf8");

    assert.match(directorPrompt, /three-minute spine/i);
    assert.match(directorPrompt, /first 10 seconds/i);
    assert.match(directorPrompt, /pair, low-risk auto-approval, paid approval, block, revoke/i);
    assert.match(directorPrompt, /Do not say or imply that SkillGuard auto-signs spending transactions/i);
    assert.match(directorPrompt, /do not waste time/i);
  });

  it("tells the HTML video agent not to render voiceover subtitles", () => {
    const prompt = readFileSync("demo-package/prompts/html-video-agent-prompt.md", "utf8");

    assert.match(prompt, /Do not place the full voiceover on screen/i);
    assert.match(prompt, /micro-copy/i);
    assert.match(prompt, /picture-in-picture/i);
  });
});
