import { describe, expect, it } from "vitest";

import { publicKeyForKeyPair, smokeAgentKeyPair } from "./client.js";
import { readAgentRuntimeEnv } from "./agentIdentity.js";

describe("agent runtime identity", () => {
  it("reads a custom QR-paired agent identity from env", () => {
    const seed = "3AQTaduKvYWFTu1ExZSQK1hQp5jSZ2yEt4KzsASAufKd";

    const runtime = readAgentRuntimeEnv({
      SKILLGUARD_AGENT_DESCRIPTION: "Live QR-paired research agent.",
      SKILLGUARD_AGENT_ID: "agent-research-live",
      SKILLGUARD_AGENT_NAME: "Research Agent Live",
      SKILLGUARD_AGENT_PRIVATE_KEY_B58: seed,
      SKILLGUARD_API_URL: "https://skillguard-sol.vercel.app/api",
      SKILLGUARD_USER_WALLET: "Wallet111",
    } as NodeJS.ProcessEnv);

    expect(runtime.agent).toEqual({
      agentId: "agent-research-live",
      description: "Live QR-paired research agent.",
      name: "Research Agent Live",
    });
    expect(runtime.apiUrl).toBe("https://skillguard-sol.vercel.app/api");
    expect(runtime.connectionId).toBe("conn-agent-research-live-Wallet111");
    expect(publicKeyForKeyPair(runtime.keyPair)).toBe(
      publicKeyForKeyPair(smokeAgentKeyPair())
    );
  });
});
