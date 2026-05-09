import {
  connectionIdForWallet,
  keyPairFromBase58,
  RESEARCH_AGENT,
  type ResearchAgentIdentity,
  smokeAgentKeyPair,
} from "./client.js";

const DEFAULT_API_URL = "http://localhost:8787";

export function readAgentRuntimeEnv(env: NodeJS.ProcessEnv = process.env) {
  const userWallet = env.SKILLGUARD_USER_WALLET;
  if (!userWallet) {
    throw new Error("Set SKILLGUARD_USER_WALLET to the connected mobile wallet address.");
  }
  const agent = readAgentIdentity(env);

  return {
    agent,
    apiUrl: env.SKILLGUARD_API_URL ?? DEFAULT_API_URL,
    connectionId: env.SKILLGUARD_CONNECTION_ID ?? connectionIdForWallet(userWallet, agent.agentId),
    keyPair: agentKeyPairForWallet(userWallet, env),
    userWallet,
  };
}

export function readAgentIdentity(
  env: NodeJS.ProcessEnv = process.env
): ResearchAgentIdentity {
  return {
    agentId: env.SKILLGUARD_AGENT_ID ?? RESEARCH_AGENT.agentId,
    description: env.SKILLGUARD_AGENT_DESCRIPTION ?? RESEARCH_AGENT.description,
    name: env.SKILLGUARD_AGENT_NAME ?? RESEARCH_AGENT.name,
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
