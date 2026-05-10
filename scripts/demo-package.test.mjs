import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename } from "node:path";

const requiredFiles = [
  "demo-package/00_READ_THIS_FIRST_PROMPT.md",
  "demo-package/01_STORY_SCRIPT_AND_SHOTS.md",
  "demo-package/02_VISUAL_COMPONENTS_AND_TECH_PROOF.md",
  "demo-package/site-home-desktop.png",
  "demo-package/site-demo-desktop.png",
  "demo-package/site-home-mobile.png",
];

describe("demo package", () => {
  it("is the flat handoff bundle and stays under the 10-file agent import limit", () => {
    const entries = readdirSync("demo-package", { withFileTypes: true }).filter(
      (entry) => !entry.name.startsWith("."),
    );
    const filenames = entries.map((entry) => entry.name).sort();

    assert.ok(entries.every((entry) => entry.isFile()), "demo-package must not contain subfolders");
    assert.ok(filenames.length <= 10, `demo-package contains ${filenames.length} files`);
    assert.deepEqual(
      filenames,
      requiredFiles.map((file) => basename(file)).sort(),
    );

    for (const file of requiredFiles) {
      assert.equal(existsSync(file), true, `${file} is missing`);
    }
  });

  it("includes the copy-paste prompt and delivery constraints for the video agent", () => {
    const prompt = readFileSync("demo-package/00_READ_THIS_FIRST_PROMPT.md", "utf8");

    assert.match(prompt, /compact flat bundle/i);
    assert.match(prompt, /Runtime under 3 minutes/i);
    assert.match(prompt, /No audio track/i);
    assert.match(prompt, /No generated voiceover/i);
    assert.match(prompt, /No full-script subtitles/i);
    assert.match(prompt, /site-home-desktop\.png/i);
    assert.match(prompt, /Produce the final animated HTML presentation now/i);
  });

  it("centers the script on the agent wallet-firewall gap", () => {
    const story = readFileSync("demo-package/01_STORY_SCRIPT_AND_SHOTS.md", "utf8");

    assert.match(story, /wallet firewall for AI agents/i);
    assert.match(story, /wallet access without giving up control/i);
    assert.match(story, /Allow, Ask, Block, and Revoke/i);
    assert.match(story, /0\.001 SOL/i);
    assert.match(story, /Solana devnet receipt/i);
    assert.match(story, /Voiceover Script/i);
  });

  it("contains the visual system, app screens, and technical proof references", () => {
    const visuals = readFileSync("demo-package/02_VISUAL_COMPONENTS_AND_TECH_PROOF.md", "utf8");

    assert.match(visuals, /site-home-desktop\.png/i);
    assert.match(visuals, /Phone Screens To Recreate/i);
    assert.match(visuals, /Technical Proof/i);
    assert.match(visuals, /Android APK/i);
    assert.match(visuals, /Mobile Wallet Adapter/i);
    assert.match(visuals, /auto-sign spending transactions/i);
  });
});
