import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const requiredFiles = [
  "demo-package/MASTER_BRIEF.md",
  "demo-package/00_FLAT_VIDEO_AGENT_HANDOFF.md",
  "demo-package/PROMPT_TO_VIDEO_AGENT.md",
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
  "demo-package/references/site-home-reference.md",
  "demo-package/references/product-context.md",
  "demo-package/references/technical-proof.md",
  "demo-package/references/demo-flow.md",
  "demo-package/video-agent-flat-bundle/00_READ_THIS_FIRST_PROMPT.md",
  "demo-package/video-agent-flat-bundle/01_STORY_SCRIPT_AND_SHOTS.md",
  "demo-package/video-agent-flat-bundle/02_VISUAL_COMPONENTS_AND_TECH_PROOF.md",
  "demo-package/video-agent-flat-bundle/site-home-desktop.png",
  "demo-package/video-agent-flat-bundle/site-demo-desktop.png",
  "demo-package/video-agent-flat-bundle/site-home-mobile.png",
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
    assert.match(directorPrompt, /site-home-reference\.md/i);
    assert.match(directorPrompt, /pair, low-risk auto-approval, paid approval, block, revoke/i);
    assert.match(directorPrompt, /Do not say or imply that SkillGuard auto-signs spending transactions/i);
    assert.match(directorPrompt, /do not waste time/i);
  });

  it("supports flattened file imports with a single self-contained handoff", () => {
    const flatHandoff = readFileSync("demo-package/00_FLAT_VIDEO_AGENT_HANDOFF.md", "utf8");

    assert.match(flatHandoff, /imported without folder structure/i);
    assert.match(flatHandoff, /site-home-desktop\.png/i);
    assert.match(flatHandoff, /Do not generate audio/i);
    assert.match(flatHandoff, /Do not render the full voiceover as subtitles/i);
    assert.match(flatHandoff, /Low-risk work can proceed automatically/i);
    assert.match(flatHandoff, /Do not say or imply that SkillGuard auto-signs spending transactions/i);
  });

  it("includes a copy-paste prompt for the external video agent", () => {
    const prompt = readFileSync("demo-package/PROMPT_TO_VIDEO_AGENT.md", "utf8");

    assert.match(prompt, /00_FLAT_VIDEO_AGENT_HANDOFF\.md/i);
    assert.match(prompt, /site-home-desktop\.png/i);
    assert.match(prompt, /No audio track/i);
    assert.match(prompt, /No full-script subtitles/i);
    assert.match(prompt, /Do not say or imply that SkillGuard auto-signs spending transactions/i);
    assert.match(prompt, /Produce the final animated HTML presentation now/i);
  });

  it("provides a compact flat bundle under the 12-file agent import limit", () => {
    const bundleDir = "demo-package/video-agent-flat-bundle";
    const bundleFiles = readdirSync(bundleDir).filter((file) => !file.startsWith("."));
    const prompt = readFileSync(`${bundleDir}/00_READ_THIS_FIRST_PROMPT.md`, "utf8");
    const story = readFileSync(`${bundleDir}/01_STORY_SCRIPT_AND_SHOTS.md`, "utf8");
    const visuals = readFileSync(`${bundleDir}/02_VISUAL_COMPONENTS_AND_TECH_PROOF.md`, "utf8");

    assert.ok(bundleFiles.length <= 12, `bundle contains ${bundleFiles.length} files`);
    assert.deepEqual(bundleFiles.sort(), [
      "00_READ_THIS_FIRST_PROMPT.md",
      "01_STORY_SCRIPT_AND_SHOTS.md",
      "02_VISUAL_COMPONENTS_AND_TECH_PROOF.md",
      "site-demo-desktop.png",
      "site-home-desktop.png",
      "site-home-mobile.png",
    ]);

    assert.match(prompt, /compact flat bundle/i);
    assert.match(prompt, /Runtime under 3 minutes/i);
    assert.match(prompt, /No audio track/i);
    assert.match(story, /Voiceover Script/i);
    assert.match(story, /wallet firewall for AI agents/i);
    assert.match(visuals, /Phone Screens To Recreate/i);
    assert.match(visuals, /Technical Proof/i);
    assert.match(visuals, /auto-sign spending transactions/i);
  });

  it("tells the HTML video agent not to render voiceover subtitles", () => {
    const prompt = readFileSync("demo-package/prompts/html-video-agent-prompt.md", "utf8");

    assert.match(prompt, /Do not place the full voiceover on screen/i);
    assert.match(prompt, /micro-copy/i);
    assert.match(prompt, /picture-in-picture/i);
  });
});
