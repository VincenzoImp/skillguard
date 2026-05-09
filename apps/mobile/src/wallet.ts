import type { AppIdentity } from "@wallet-ui/react-native-web3js";

export const SOLANA_DEVNET_ENDPOINT = "https://api.devnet.solana.com";
export const SOLANA_DEVNET_CHAIN = "solana:devnet";

export const SKILLGUARD_IDENTITY: AppIdentity = {
  name: "SkillGuard",
  uri: "https://skillguard.dev",
};

export function explorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
