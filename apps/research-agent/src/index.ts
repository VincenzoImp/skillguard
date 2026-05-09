import { createResearchManifest, type ResearchActionKind } from "./actions.js";
import {
  connectionIdForWallet,
  createSkillGuardClient,
  keyPairFromBase58,
  smokeAgentKeyPair,
} from "./client.js";

const DEFAULT_API_URL = "http://localhost:8787";

async function main() {
  const kind = parseKind(process.argv[2]);
  const userWallet = process.env.SKILLGUARD_USER_WALLET;
  if (!userWallet) {
    throw new Error("Set SKILLGUARD_USER_WALLET to the connected mobile wallet address.");
  }

  const connectionId =
    process.env.SKILLGUARD_CONNECTION_ID ?? connectionIdForWallet(userWallet);
  const client = createSkillGuardClient({
    agentKeyPair: agentKeyPairForWallet(userWallet),
    apiUrl: process.env.SKILLGUARD_API_URL ?? DEFAULT_API_URL,
    connectionId,
  });

  if (process.env.SKILLGUARD_AUTO_CONNECT === "1") {
    await client.ensureAgentConnection(userWallet);
  }

  if (kind === "revoked") {
    if (!userWallet.startsWith("SmokeWallet")) {
      throw new Error("Revoked path requires the wallet owner to revoke in the mobile app.");
    }
    await client.revokeConnection();
  }

  const manifest = createResearchManifest(kind, process.env.SKILLGUARD_RUN_ID, userWallet);
  const submitted = await client.submitAction(manifest);

  console.log(
    JSON.stringify(
      {
        actionId: submitted.action.actionId,
        kind,
        policyReasons: submitted.result.reasons,
        policyStatus: submitted.result.status,
      },
      null,
      2
    )
  );
}

function agentKeyPairForWallet(userWallet: string) {
  const encoded =
    process.env.SKILLGUARD_AGENT_PRIVATE_KEY_B58 ?? process.env.SKILLGUARD_AGENT_PRIVATE_KEY;
  if (encoded) {
    return keyPairFromBase58(encoded);
  }
  if (userWallet.startsWith("SmokeWallet")) {
    return smokeAgentKeyPair();
  }

  throw new Error("Set SKILLGUARD_AGENT_PRIVATE_KEY_B58 before submitting real wallet actions.");
}

function parseKind(value: string | undefined): ResearchActionKind {
  if (value === "safe" || value === "unsafe" || value === "revoked") {
    return value;
  }

  throw new Error("Usage: npm run submit:safe|submit:unsafe|submit:revoked");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Research agent failed";
  console.error(message);
  process.exitCode = 1;
});
