import { describe, expect, it } from "vitest";
import config from "./vite.config";

describe("vite config", () => {
  it("builds asset URLs under the GitHub Pages project path", () => {
    expect(config.base).toBe("/skillguard/");
  });
});
