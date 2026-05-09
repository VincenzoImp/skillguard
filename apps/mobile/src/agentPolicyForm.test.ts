import { describe, expect, it } from "vitest";

import {
  buildAgentPolicyInput,
  parseAgentPairingInput,
  parseCsvList,
  parseUsdcToAtomic,
} from "./agentPolicyForm";

describe("agent policy form helpers", () => {
  it("converts USDC form values into atomic units", () => {
    expect(parseUsdcToAtomic("1")).toBe("1000000");
    expect(parseUsdcToAtomic("1.25")).toBe("1250000");
    expect(parseUsdcToAtomic("0.000001")).toBe("1");
  });

  it("rejects invalid USDC form values", () => {
    expect(() => parseUsdcToAtomic("")).toThrow(/required/);
    expect(() => parseUsdcToAtomic("-1")).toThrow(/positive/);
    expect(() => parseUsdcToAtomic("1.0000001")).toThrow(/six decimals/);
    expect(() => parseUsdcToAtomic("abc")).toThrow(/valid number/);
  });

  it("normalizes comma separated policy lists", () => {
    expect(parseCsvList(" helius, birdeye,, HELIUS ")).toEqual([
      "helius",
      "birdeye",
    ]);
  });

  it("builds policy overrides from the import form", () => {
    expect(
      buildAgentPolicyInput({
        allowedMints: "SOL, USDC",
        allowedProtocols: "helius, birdeye",
        dailySpendUsdc: "5",
        maxSpendUsdc: "1.5",
        mode: "allow_under_limits",
      })
    ).toEqual({
      allowedMints: ["SOL", "USDC"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "5000000",
      maxSpendAtomic: "1500000",
      mode: "allow_under_limits",
    });
  });

  it("parses a SkillGuard pairing link into import form values", () => {
    expect(
      parseAgentPairingInput(
        "skillguard://pair?agentId=agent-research&name=Research%20Agent&description=Wallet%20risk%20checks&protocols=helius,birdeye"
      )
    ).toEqual({
      agentId: "agent-research",
      allowedProtocols: "helius,birdeye",
      description: "Wallet risk checks",
      name: "Research Agent",
    });
  });

  it("ignores regular agent IDs when parsing pairing links", () => {
    expect(parseAgentPairingInput("agent-research")).toBeNull();
  });
});
