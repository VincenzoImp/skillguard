import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "apps/site/public/demo/story/index.html",
  "apps/site/public/demo/story/animations.jsx",
  "apps/site/public/demo/story/ui.jsx",
  "apps/site/public/demo/story/nodes.jsx",
  "apps/site/public/demo/story/phone.jsx",
  "apps/site/public/demo/story/scenes.jsx",
  "apps/site/public/demo/story/README.md",
  "apps/site/public/demo/story/SCRIPT.md",
  "apps/site/public/demo/story/VOICEOVER_ELEVENLABS.txt",
  "apps/site/public/demo/story/VOICEOVER_ELEVENLABS_WITH_BREAKS.txt",
];

describe("story demo", () => {
  it("ships the executable animated story under the public site path", () => {
    for (const file of requiredFiles) {
      assert.equal(existsSync(file), true, `${file} is missing`);
    }

    assert.equal(existsSync("demo-package"), false, "stale demo-package folder should not be committed");
  });

  it("keeps the full voiceover script, timing, and product boundary with the demo", () => {
    const story = readFileSync("apps/site/public/demo/story/SCRIPT.md", "utf8");

    assert.match(story, /wallet firewall for AI agents/i);
    assert.match(story, /wallet access without giving up control/i);
    assert.match(story, /Allow, Ask, Block, and Revoke/i);
    assert.match(story, /Three-Minute Timing/i);
    assert.match(story, /0:00-0:12/i);
    assert.match(story, /Demo Agent/i);
    assert.match(story, /0\.001 SOL/i);
    assert.match(story, /Solana devnet receipt/i);
    assert.match(story, /Voiceover Script/i);
    assert.doesNotMatch(story, /Research Agent Live/i);
  });

  it("loads the local JSX story modules from the HTML entrypoint", () => {
    const html = readFileSync("apps/site/public/demo/story/index.html", "utf8");

    assert.match(html, /SkillGuard — Wallet firewall for AI agents/);
    assert.match(html, /src="animations\.jsx"/);
    assert.match(html, /src="ui\.jsx"/);
    assert.match(html, /src="nodes\.jsx"/);
    assert.match(html, /src="phone\.jsx"/);
    assert.match(html, /src="scenes\.jsx"/);
    assert.match(html, /<StoryDeck \/>/);
  });

  it("documents how the committed demo should be used", () => {
    const readme = readFileSync("apps/site/public/demo/story/README.md", "utf8");

    assert.match(readme, /static animated story/i);
    assert.match(readme, /SCRIPT\.md/i);
    assert.match(readme, /VOICEOVER_ELEVENLABS\.txt/i);
    assert.match(readme, /VOICEOVER_ELEVENLABS_WITH_BREAKS\.txt/i);
    assert.match(readme, /Do not render the full\s+voiceover as subtitles/i);
    assert.match(readme, /\/demo\/story\/index\.html/i);
  });

  it("includes a clean ElevenLabs voiceover input without markdown or timecodes", () => {
    const voiceover = readFileSync("apps/site/public/demo/story/VOICEOVER_ELEVENLABS.txt", "utf8");
    const wordCount = voiceover.trim().split(/\s+/).length;

    assert.match(voiceover, /SkillGuard, the wallet firewall for AI agents/i);
    assert.match(voiceover, /Agents can act\.\s+Users stay in control\./i);
    assert.match(voiceover, /Mobile Wallet Adapter/i);
    assert.match(voiceover, /Solana devnet receipts/i);
    assert.ok(wordCount >= 350 && wordCount <= 470, `unexpected voiceover word count: ${wordCount}`);
    assert.doesNotMatch(voiceover, /^#/m);
    assert.doesNotMatch(voiceover, /\d:\d{2}/);
    assert.doesNotMatch(voiceover, /Shot \d/i);
  });

  it("includes an optional ElevenLabs break-tag version for supported models", () => {
    const voiceover = readFileSync(
      "apps/site/public/demo/story/VOICEOVER_ELEVENLABS_WITH_BREAKS.txt",
      "utf8",
    );

    assert.match(voiceover, /<break time="0\.[0-9]+s" \/>/);
    assert.match(voiceover, /The next wave of AI agents/i);
    assert.match(voiceover, /Users stay in control\./i);
    assert.doesNotMatch(voiceover, /<break time="[3-9]\.[0-9]+s" \/>/);
    assert.doesNotMatch(voiceover, /^#/m);
    assert.doesNotMatch(voiceover, /\d:\d{2}/);
  });
});
