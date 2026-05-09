import { liveSiteUrl } from "./liveApi";

export const researchAgentPairing = {
  agentId: "agent-research",
  description: "Solana wallet risk agent that requests wallet-safe actions.",
  name: "Research Agent",
  protocols: "helius,birdeye",
  publicKey: "9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu",
};

export const researchAgentPairingLink = buildPairingLink(researchAgentPairing);

function buildPairingLink(agent: typeof researchAgentPairing): string {
  const url = new URL("/pair", liveSiteUrl);
  url.searchParams.set("agentId", agent.agentId);
  url.searchParams.set("name", agent.name);
  url.searchParams.set("description", agent.description);
  url.searchParams.set("protocols", agent.protocols);
  url.searchParams.set("publicKey", agent.publicKey);
  return url.toString();
}
