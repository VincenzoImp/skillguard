import { createDemoManifest, type DemoActionKind } from "./actions.js";
import { createSkillGuardClient } from "./client.js";

const DEFAULT_API_URL = "http://localhost:8787";
const DEFAULT_CONNECTION_ID = "conn-demo";

async function main() {
  const kind = parseKind(process.argv[2]);
  const client = createSkillGuardClient({
    apiUrl: process.env.SKILLGUARD_API_URL ?? DEFAULT_API_URL,
    connectionId: process.env.SKILLGUARD_CONNECTION_ID ?? DEFAULT_CONNECTION_ID,
  });

  if (kind === "revoked") {
    await client.revokeConnection();
  }

  const manifest = createDemoManifest(kind, process.env.SKILLGUARD_RUN_ID);
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

function parseKind(value: string | undefined): DemoActionKind {
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
