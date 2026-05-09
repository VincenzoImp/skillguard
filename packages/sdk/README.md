# SkillGuard SDK

TypeScript client for agents that submit SkillGuard action manifests.

```ts
import { createSkillGuardClient } from "@skillguard/sdk";
import bs58 from "bs58";
import nacl from "tweetnacl";

const keyPair = nacl.sign.keyPair.fromSecretKey(
  bs58.decode(process.env.SKILLGUARD_AGENT_PRIVATE_KEY_B58!)
);

const client = createSkillGuardClient({
  agentId: "agent-research",
  agentSigner: {
    publicKey: bs58.encode(keyPair.publicKey),
    signMessage: (message) => nacl.sign.detached(message, keyPair.secretKey),
  },
  apiUrl: "https://skillguard-sol.vercel.app/api",
  connectionId: `conn-agent-research-${userWallet}`,
});

const action = await client.submitAction(manifest);
const decision = await client.onDecision(action.actionId);
```

The wallet owner must import the agent first. `submitAction` signs the manifest
with the registered agent key; SkillGuard rejects unsigned or mismatched agent
requests before they can appear in the mobile inbox.
