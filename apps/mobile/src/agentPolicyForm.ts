import type { ApprovalMode } from "@skillguard/protocol";
import type { SkillGuardPolicyInput } from "./liveApi";

interface AgentPolicyFormValues {
  allowedMints: string;
  allowedProtocols: string;
  dailySpendUsdc: string;
  maxSpendUsdc: string;
  mode: ApprovalMode;
}

const allowedMintValues = new Set(["SOL", "USDC"]);

export function buildAgentPolicyInput(
  values: AgentPolicyFormValues
): SkillGuardPolicyInput {
  return {
    allowedMints: parseMintList(values.allowedMints),
    allowedNetworks: ["solana-devnet"],
    allowedProtocols: parseCsvList(values.allowedProtocols),
    dailySpendCapAtomic: parseUsdcToAtomic(values.dailySpendUsdc),
    maxSpendAtomic: parseUsdcToAtomic(values.maxSpendUsdc),
    mode: values.mode,
  };
}

export function parseCsvList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

export function parseUsdcToAtomic(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("USDC amount is required");
  }
  if (trimmed.startsWith("-")) {
    throw new Error("USDC amount must be positive");
  }
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("USDC amount must be a valid number");
  }

  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > 6) {
    throw new Error("USDC amount supports at most six decimals");
  }

  const atomic = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
  if (atomic <= 0n) {
    throw new Error("USDC amount must be positive");
  }
  return atomic.toString();
}

function parseMintList(value: string): Array<"SOL" | "USDC"> {
  const mints = Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    )
  );
  if (mints.length === 0) {
    throw new Error("At least one mint is required");
  }
  for (const mint of mints) {
    if (!allowedMintValues.has(mint)) {
      throw new Error(`Unsupported mint: ${mint}`);
    }
  }
  return mints as Array<"SOL" | "USDC">;
}

export type { AgentPolicyFormValues };
