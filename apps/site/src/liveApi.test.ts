import { describe, expect, it } from "vitest";

import { liveApiBaseUrl, liveApiEndpoints } from "./liveApi";

describe("liveApi", () => {
  it("uses the canonical Vercel production API domain", () => {
    expect(liveApiBaseUrl).toBe("https://skillguard-sol.vercel.app/api");
  });

  it("documents the core hosted API routes needed by agents and mobile clients", () => {
    expect(liveApiEndpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).toEqual([
      "GET /api/health",
      "GET /api/agents",
      "POST /api/agents",
      "POST /api/wallet-sessions",
      "GET /api/connections?wallet=<wallet>",
      "POST /api/connections",
      "PATCH /api/connections/:connectionId/policy",
      "POST /api/connections/:connectionId/revoke",
      "POST /api/actions",
      "GET /api/actions?wallet=<wallet>",
      "POST /api/actions/:actionId/evaluate",
      "POST /api/actions/:actionId/decision",
    ]);
  });
});
