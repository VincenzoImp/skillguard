import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import type { ActionManifest } from "@skillguard/protocol";

export interface BuildApprovalTransactionInput {
  manifest: ActionManifest;
  owner: PublicKey;
  blockhash: string;
  treasuryAddress: string;
  receiptInstructions: TransactionInstruction[];
}

export function buildApprovalTransaction(input: BuildApprovalTransactionInput): Transaction {
  const { manifest, owner, blockhash, treasuryAddress, receiptInstructions } = input;
  const tx = new Transaction({ feePayer: owner, recentBlockhash: blockhash });

  const lamports = totalLamportSpend(manifest);
  if (lamports > 0n) {
    tx.add(
      SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: new PublicKey(treasuryAddress),
        lamports: Number(lamports),
      }),
    );
  }

  for (const ix of receiptInstructions) {
    tx.add(ix);
  }

  return tx;
}

function totalLamportSpend(manifest: ActionManifest): bigint {
  let total = 0n;
  for (const item of manifest.spend) {
    if (item.amountAtomic === "0") continue;
    if (item.mint !== "SOL") {
      throw new Error(`buildApprovalTransaction: only SOL spend is supported, got ${item.mint}`);
    }
    total += BigInt(item.amountAtomic);
  }
  return total;
}
