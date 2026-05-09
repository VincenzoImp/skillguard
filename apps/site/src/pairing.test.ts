import { describe, expect, it } from "vitest";

import { researchAgentPairingLink } from "./pairing";

describe("pairing", () => {
  it("builds a hosted QR-compatible research-agent pairing link", () => {
    const url = new URL(researchAgentPairingLink);

    expect(url.origin).toBe("https://skillguard-sol.vercel.app");
    expect(url.pathname).toBe("/pair");
    expect(url.searchParams.get("agentId")).toBe("agent-research");
    expect(url.searchParams.get("name")).toBe("Research Agent");
    expect(url.searchParams.get("description")).toMatch(/wallet risk/i);
    expect(url.searchParams.get("protocols")).toBe("helius,birdeye");
    expect(url.searchParams.get("publicKey")).toBeTruthy();
  });
});
