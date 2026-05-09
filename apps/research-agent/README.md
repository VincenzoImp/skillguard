# SkillGuard Research Agent

Sample research-agent implementation used for the hackathon demo and smoke
tests. It is a real client of the SkillGuard API, not preloaded mobile state.

Capabilities:

- request wallet-risk report approval
- request unsafe overspend action for block demo
- request LI.FI route preview if enabled
- receive approval/rejection callbacks

## Commands

The research agent must target the wallet currently connected in the mobile app:

Before submitting actions, import this agent in the app for that wallet. The
smooth path is to paste this pairing link into the app's Agent ID field, review
limits, and sign the wallet-owner challenge:

```text
skillguard://pair?agentId=agent-research&name=Research%20Agent&description=Solana%20research%20agent%20that%20requests%20wallet-safe%20actions.&protocols=helius,birdeye&publicKey=9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu
```

Manual import values:

```text
Agent ID: agent-research
Display name: Research Agent
Allowed purpose: Solana research agent that requests wallet-safe actions.
Mode: Ask every time
Max spend per action: 1
Daily cap: 5
Allowed protocols: helius,birdeye
Allowed mints: SOL,USDC
Agent public key: 9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu
```

```bash
export SKILLGUARD_API_URL=http://localhost:8787
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<agent-secret-key-from-password-manager>
npm run submit:unsafe
npm run submit:safe
npm run submit:revoked
```

By default the CLI only submits actions to an existing wallet-owner-signed
connection. It never receives the user's private key and cannot connect itself
to a real wallet. Every submitted action is signed with the agent private key
whose public key appears in the pairing link. For automated smoke tests without
a phone, set `SKILLGUARD_AUTO_CONNECT=1` to create a fake `SmokeWallet...`
research-agent connection before submitting. Hosted smoke runs clean those
records through `DELETE /smoke-runs/:runId` after the assertions complete.

Generate a new agent key and pairing link:

```bash
node ../../scripts/generate-agent-key.mjs agent-research "Research Agent"
```
