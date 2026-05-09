import { describe, expect, it } from "vitest";

import {
  buildAgentPolicyInput,
  parseAgentPairingInput,
  parseCsvList,
  parseSolToLamports,
} from "./agentPolicyForm";

describe("agent policy form helpers", () => {
  it("converts SOL form values into lamports", () => {
    expect(parseSolToLamports("1")).toBe("1000000000");
    expect(parseSolToLamports("0.01")).toBe("10000000");
    expect(parseSolToLamports("0.000000001")).toBe("1");
  });

  it("rejects invalid SOL form values", () => {
    expect(() => parseSolToLamports("")).toThrow(/required/);
    expect(() => parseSolToLamports("-1")).toThrow(/positive/);
    expect(() => parseSolToLamports("1.0000000001")).toThrow(/nine decimals/);
    expect(() => parseSolToLamports("abc")).toThrow(/valid number/);
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
        dailySpendSol: "0.05",
        maxSpendSol: "0.01",
        mode: "allow_under_limits",
      })
    ).toEqual({
      allowedMints: ["SOL", "USDC"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "50000000",
      maxSpendAtomic: "10000000",
      mode: "allow_under_limits",
    });
  });

  it("parses a SkillGuard pairing link into import form values", () => {
    expect(
      parseAgentPairingInput(
        "skillguard://pair?agentId=agent-research&name=Research%20Agent&description=Wallet%20risk%20checks&protocols=helius,birdeye&publicKey=AgentPubkey111"
      )
    ).toEqual({
      agentId: "agent-research",
      allowedProtocols: "helius,birdeye",
      description: "Wallet risk checks",
      name: "Research Agent",
      publicKey: "AgentPubkey111",
    });
  });

  it("parses hosted pairing links used by QR codes", () => {
    expect(
      parseAgentPairingInput(
        "https://skillguard-sol.vercel.app/pair?agentId=agent-research&name=Research%20Agent&description=Wallet%20risk%20checks&protocols=helius,birdeye&publicKey=AgentPubkey111"
      )
    ).toEqual({
      agentId: "agent-research",
      allowedProtocols: "helius,birdeye",
      description: "Wallet risk checks",
      name: "Research Agent",
      publicKey: "AgentPubkey111",
    });
  });

  it("ignores regular agent IDs when parsing pairing links", () => {
    expect(parseAgentPairingInput("agent-research")).toBeNull();
  });
});
