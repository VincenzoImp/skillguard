import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

  it("defines explicit production API function entries for nested routes", () => {
    const requiredRoutes = [
      "../../api/actions/[actionId].ts",
      "../../api/actions/[actionId]/decision.ts",
      "../../api/actions/[actionId]/evaluate.ts",
      "../../api/actions/pending.ts",
      "../../api/agents/[agentId].ts",
      "../../api/connections/[connectionId].ts",
      "../../api/connections/[connectionId]/policy.ts",
      "../../api/connections/[connectionId]/revoke.ts",
    ];

    for (const route of requiredRoutes) {
      const routePath = resolve(__dirname, route);
      expect(existsSync(routePath), route).toBe(true);
      const routeSource = readFileSync(routePath, "utf8");
      expect(routeSource).toContain("[...path].js");
      const target = routeSource.match(/from "(.+)";/)?.[1]?.replace(/\.js$/, ".ts");
      expect(target, route).toBeTruthy();
      expect(existsSync(resolve(dirname(routePath), target as string)), route).toBe(true);
    }
  });
});
