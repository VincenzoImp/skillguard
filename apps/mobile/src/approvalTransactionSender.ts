import type {
  BlockhashWithExpiryBlockHeight,
  Commitment,
  RpcResponseAndContext,
  SignatureResult,
  Transaction,
} from "@solana/web3.js";

interface ApprovalConnection {
  confirmTransaction(
    strategy: BlockhashWithExpiryBlockHeight & { signature: string },
    commitment?: Commitment
  ): Promise<RpcResponseAndContext<SignatureResult>>;
  sendRawTransaction(
    rawTransaction: Buffer | Uint8Array | number[],
    options?: {
      maxRetries?: number;
      preflightCommitment?: Commitment;
      skipPreflight?: boolean;
    }
  ): Promise<string>;
}

interface SignAndSubmitApprovalTransactionInput {
  connection: ApprovalConnection;
  latestBlockhash: BlockhashWithExpiryBlockHeight;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  transaction: Transaction;
}

export async function signAndSubmitApprovalTransaction({
  connection,
  latestBlockhash,
  signTransaction,
  transaction,
}: SignAndSubmitApprovalTransactionInput): Promise<string> {
  const signedTransaction = await signTransaction(transaction);
  const signature = await connection.sendRawTransaction(
    signedTransaction.serialize(),
    {
      maxRetries: 3,
      preflightCommitment: "confirmed",
      skipPreflight: false,
    }
  );
  const confirmation = await connection.confirmTransaction(
    { ...latestBlockhash, signature },
    "confirmed"
  );

  if (confirmation.value.err) {
    throw new Error(
      `SkillGuard devnet confirmation failed: ${JSON.stringify(confirmation.value.err)}`
    );
  }

  return signature;
}
