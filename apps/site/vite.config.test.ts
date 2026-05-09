import { describe, expect, it } from "vitest";
import config, { getBasePath } from "./vite.config";

describe("vite config", () => {
  it("builds asset URLs under the GitHub Pages project path", () => {
    expect(config.base).toBe("/skillguard/");
  });

  it("allows Vercel builds to serve assets from the domain root", () => {
    expect(getBasePath({ VITE_BASE_PATH: "/" })).toBe("/");
  });
});
