import { readAgentRuntimeEnv } from "./agentIdentity.js";
import { createSkillGuardClient } from "./client.js";
import { runLoop } from "./loop.js";

async function main() {
  const runtime = readAgentRuntimeEnv();
  const client = createSkillGuardClient({
    agent: runtime.agent,
    agentKeyPair: runtime.keyPair,
    apiUrl: runtime.apiUrl,
    connectionId: runtime.connectionId,
  });

  await runLoop({
    agentId: runtime.agent.agentId,
    client,
    runId: process.env.SKILLGUARD_RUN_ID,
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    userWallet: runtime.userWallet,
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Research agent loop failed";
  console.error(message);
  process.exitCode = 1;
});
