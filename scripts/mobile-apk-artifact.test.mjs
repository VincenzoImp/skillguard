import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const canonicalApk = "build/mobile/skillguard.apk";
const staleApkNames = [
  "skillguard-debug.apk",
  "skillguard-standalone-debugsigned.apk",
  "skillguard-release-signed.apk",
];

const sourceFiles = [
  "README.md",
  "apps/mobile/README.md",
  "docs/FEASIBILITY.md",
  "docs/SUBMISSION.md",
  "docs/ROADMAP.md",
  "scripts/build-mobile-apk.sh",
  "scripts/submission-check.sh",
];

describe("mobile APK artifact policy", () => {
  it("documents one canonical APK path", () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file, "utf8");
      assert.match(text, new RegExp(escapeRegExp(canonicalApk)), file);
    }
  });

  it("does not publish stale APK artifact names in active release docs or scripts", () => {
    for (const file of sourceFiles) {
      const text = readFileSync(file, "utf8");
      for (const staleName of staleApkNames) {
        assert.doesNotMatch(text, new RegExp(escapeRegExp(staleName)), `${file}: ${staleName}`);
      }
    }
  });
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
