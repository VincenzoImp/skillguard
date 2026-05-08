import { Buffer } from "buffer";
import type { AppIdentity } from "@wallet-ui/react-native-web3js";

export const SOLANA_DEVNET_ENDPOINT = "https://api.devnet.solana.com";
export const SOLANA_DEVNET_CHAIN = "devnet";

export const SKILLGUARD_IDENTITY: AppIdentity = {
  name: "SkillGuard",
  uri: "https://skillguard.dev",
};

export const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function asciiBuffer(value: string): Buffer {
  return Buffer.from(value, "utf8");
}
