import { describe, expect, it } from "vitest";
import type { Transaction } from "@solana/web3.js";

import { signAndSubmitApprovalTransaction } from "./approvalTransactionSender";

const latestBlockhash = {
  blockhash: "EJC7sNxZk6vXxgHXDFyP8b9iFztFuY8s2hZBChGsQ8sB",
  lastValidBlockHeight: 123,
};

describe("signAndSubmitApprovalTransaction", () => {
  it("signs locally, sends raw transaction bytes, and confirms the signature", async () => {
    const calls: string[] = [];
    const transaction = {} as Transaction;
    const signedTransaction = {
      serialize: () => Buffer.from("signed-transaction"),
    } as Transaction;

    const signature = await signAndSubmitApprovalTransaction({
      connection: {
        confirmTransaction: async (strategy, commitment) => {
          calls.push(`confirm:${strategy.signature}:${commitment}`);
          expect(strategy).toMatchObject({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: "devnet-signature",
          });
          return { context: { slot: 1 }, value: { err: null } };
        },
        sendRawTransaction: async (rawTransaction, options) => {
          calls.push(`send:${Buffer.from(rawTransaction).toString("utf8")}`);
          expect(options).toMatchObject({
            maxRetries: 3,
            preflightCommitment: "confirmed",
            skipPreflight: false,
          });
          return "devnet-signature";
        },
      },
      latestBlockhash,
      signTransaction: async (tx) => {
        calls.push("sign");
        expect(tx).toBe(transaction);
        return signedTransaction;
      },
      transaction,
    });

    expect(signature).toBe("devnet-signature");
    expect(calls).toEqual([
      "sign",
      "send:signed-transaction",
      "confirm:devnet-signature:confirmed",
    ]);
  });

  it("throws when devnet confirmation returns an on-chain error", async () => {
    await expect(
      signAndSubmitApprovalTransaction({
        connection: {
          confirmTransaction: async () => ({
            context: { slot: 1 },
            value: { err: { InstructionError: [0, "Custom"] } },
          }),
          sendRawTransaction: async () => "devnet-signature",
        },
        latestBlockhash,
        signTransaction: async (tx) => tx,
        transaction: {
          serialize: () => Buffer.from("signed-transaction"),
        } as Transaction,
      })
    ).rejects.toThrow(/confirmation failed/);
  });
});
