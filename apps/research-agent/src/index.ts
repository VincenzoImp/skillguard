import { createResearchManifest, type ResearchActionKind } from "./actions.js";
import { createSkillGuardClient } from "./client.js";
import { readAgentRuntimeEnv } from "./agentIdentity.js";

async function main() {
  const kind = parseKind(process.argv[2]);
  const runtime = readAgentRuntimeEnv();
  const client = createSkillGuardClient({
    agent: runtime.agent,
    agentKeyPair: runtime.keyPair,
    apiUrl: runtime.apiUrl,
    connectionId: runtime.connectionId,
  });

  if (process.env.SKILLGUARD_AUTO_CONNECT === "1") {
    await client.ensureAgentConnection(runtime.userWallet);
  }

  if (kind === "revoked") {
    if (!runtime.userWallet.startsWith("SmokeWallet")) {
      throw new Error("Revoked path requires the wallet owner to revoke in the mobile app.");
    }
    await client.revokeConnection();
  }

  const manifest = createResearchManifest(
    kind,
    process.env.SKILLGUARD_RUN_ID,
    runtime.userWallet,
    runtime.agent.agentId
  );
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

function parseKind(value: string | undefined): ResearchActionKind {
  if (value === "safe" || value === "unsafe" || value === "revoked") {
    return value;
  }

  throw new Error("Usage: npm run submit:safe|submit:unsafe|submit:revoked");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Demo agent failed";
  console.error(message);
  process.exitCode = 1;
});
