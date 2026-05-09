import type { ActionManifest } from "@skillguard/protocol";

export interface RequiredApprovalLamportsInput {
  feeLamports: number;
  manifest: ActionManifest;
  rentLamports: number;
}

export interface RequiredApprovalLamports {
  feeLamports: number;
  rentLamports: number;
  spendLamports: number;
  totalLamports: number;
}

export interface ApprovalFundingIssueInput {
  availableLamports: number;
  required: RequiredApprovalLamports;
}

const LAMPORTS_PER_SOL = 1_000_000_000;

export function totalSolSpendLamports(manifest: ActionManifest): number {
  let total = 0n;
  for (const spend of manifest.spend) {
    if (spend.amountAtomic === "0") {
      continue;
    }
    if (spend.mint !== "SOL") {
      throw new Error(`Approval only supports SOL spend on devnet, got ${spend.mint}`);
    }
    total += BigInt(spend.amountAtomic);
  }
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Approval spend exceeds JavaScript safe integer range");
  }
  return Number(total);
}

export function requiredApprovalLamports({
  feeLamports,
  manifest,
  rentLamports,
}: RequiredApprovalLamportsInput): RequiredApprovalLamports {
  const spendLamports = totalSolSpendLamports(manifest);
  return {
    feeLamports,
    rentLamports,
    spendLamports,
    totalLamports: spendLamports + rentLamports + feeLamports,
  };
}

export function formatLamportsAsSol(lamports: number): string {
  if (lamports === 0) {
    return "0 SOL";
  }

  const whole = Math.trunc(lamports / LAMPORTS_PER_SOL);
  const fractional = `${lamports % LAMPORTS_PER_SOL}`
    .padStart(9, "0")
    .replace(/0+$/, "");
  return fractional ? `${whole}.${fractional} SOL` : `${whole} SOL`;
}

export function approvalFundingIssue({
  availableLamports,
  required,
}: ApprovalFundingIssueInput): string | null {
  if (availableLamports >= required.totalLamports) {
    return null;
  }

  return [
    "Insufficient devnet SOL:",
    `need ${formatLamportsAsSol(required.totalLamports)},`,
    `wallet has ${formatLamportsAsSol(availableLamports)}.`,
    "Airdrop devnet SOL and retry.",
  ].join(" ");
}
