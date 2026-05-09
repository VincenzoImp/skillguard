import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type VercelConfig = {
  buildCommand?: string;
};

describe("vercel config", () => {
  it("sets the site base path explicitly during the Vercel build", () => {
    const config = JSON.parse(
      readFileSync(resolve(__dirname, "../../vercel.json"), "utf8"),
    ) as VercelConfig;

    expect(config.buildCommand).toContain("VITE_BASE_PATH=/");
  });
});
