import {
  connectionIdForWallet,
  keyPairFromBase58,
  smokeAgentKeyPair,
} from "./client.js";

const DEFAULT_API_URL = "http://localhost:8787";

export function readAgentRuntimeEnv(env: NodeJS.ProcessEnv = process.env) {
  const userWallet = env.SKILLGUARD_USER_WALLET;
  if (!userWallet) {
    throw new Error("Set SKILLGUARD_USER_WALLET to the connected mobile wallet address.");
  }

  return {
    apiUrl: env.SKILLGUARD_API_URL ?? DEFAULT_API_URL,
    connectionId: env.SKILLGUARD_CONNECTION_ID ?? connectionIdForWallet(userWallet),
    keyPair: agentKeyPairForWallet(userWallet, env),
    userWallet,
  };
}

export function agentKeyPairForWallet(
  userWallet: string,
  env: NodeJS.ProcessEnv = process.env
) {
  const encoded = env.SKILLGUARD_AGENT_PRIVATE_KEY_B58 ?? env.SKILLGUARD_AGENT_PRIVATE_KEY;
  if (encoded) {
    return keyPairFromBase58(encoded);
  }
  if (userWallet.startsWith("SmokeWallet")) {
    return smokeAgentKeyPair();
  }

  throw new Error("Set SKILLGUARD_AGENT_PRIVATE_KEY_B58 before submitting real wallet actions.");
}
