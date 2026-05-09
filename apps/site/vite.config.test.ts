import { describe, expect, it } from "vitest";
import config, { getBasePath } from "./vite.config";

describe("vite config", () => {
  it("builds asset URLs from the Vercel domain root by default", () => {
    expect(config.base).toBe("/");
  });

  it("still allows an explicit base path override for previews", () => {
    expect(getBasePath({ VITE_BASE_PATH: "/preview/" })).toBe("/preview/");
  });
});
