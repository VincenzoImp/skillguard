import { describe, expect, it } from "vitest";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import type { ActionManifest } from "@skillguard/protocol";
import { buildApprovalTransaction } from "./buildApprovalTransaction";

const owner = new PublicKey("11111111111111111111111111111112");
const treasury = "11111111111111111111111111111113";
const blockhash = "EJC7sNxZk6vXxgHXDFyP8b9iFztFuY8s2hZBChGsQ8sB";

const baseManifest: ActionManifest = {
  schemaVersion: "skillguard.action.v1",
  actionId: "act-1",
  agentId: "agent-research",
  userWallet: owner.toBase58(),
  network: "solana-devnet",
  kind: "wallet_risk_report",
  title: "Free scan",
  summary: "Read-only.",
  protocols: ["helius"],
  spend: [{ mint: "SOL", amountAtomic: "0", human: "0 SOL", reason: "Read-only" }],
  accountsTouched: [owner.toBase58()],
  riskSignals: [],
  rawTransactionRef: null,
  createdAt: 0,
  expiresAt: 4_100_000_000,
};

describe("buildApprovalTransaction", () => {
  it("includes only the receipt instruction when spend is zero", () => {
    const tx = buildApprovalTransaction({
      manifest: baseManifest,
      owner,
      blockhash,
      treasuryAddress: treasury,
      receiptInstructions: [
        SystemProgram.transfer({ fromPubkey: owner, toPubkey: owner, lamports: 1 }),
      ],
    });
    expect(tx).toBeInstanceOf(Transaction);
    expect(tx.instructions).toHaveLength(1);
  });

  it("prepends a SystemProgram.transfer when SOL spend is non-zero", () => {
    const tx = buildApprovalTransaction({
      manifest: { ...baseManifest, spend: [{ mint: "SOL", amountAtomic: "1000000", human: "0.001 SOL", reason: "fee" }] },
      owner,
      blockhash,
      treasuryAddress: treasury,
      receiptInstructions: [
        SystemProgram.transfer({ fromPubkey: owner, toPubkey: owner, lamports: 1 }),
      ],
    });
    expect(tx.instructions).toHaveLength(2);
    const first = tx.instructions[0];
    expect(first.programId.toBase58()).toBe(SystemProgram.programId.toBase58());
  });

  it("throws on non-SOL spend (USDC not supported in MVP)", () => {
    expect(() =>
      buildApprovalTransaction({
        manifest: { ...baseManifest, spend: [{ mint: "USDC", amountAtomic: "100000", human: "0.10 USDC", reason: "fee" }] },
        owner,
        blockhash,
        treasuryAddress: treasury,
        receiptInstructions: [],
      }),
    ).toThrow(/SOL/);
  });

  it("throws before building an unsafe lamport transfer amount", () => {
    expect(() =>
      buildApprovalTransaction({
        manifest: {
          ...baseManifest,
          spend: [
            {
              mint: "SOL",
              amountAtomic: `${Number.MAX_SAFE_INTEGER + 1}`,
              human: "too much SOL",
              reason: "unsafe integer",
            },
          ],
        },
        owner,
        blockhash,
        treasuryAddress: treasury,
        receiptInstructions: [],
      }),
    ).toThrow(/safe integer/);
  });
});
