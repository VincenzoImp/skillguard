# SkillGuard Demo Agent

Sample agent used for the hackathon demo.

Capabilities:

- request wallet-risk report approval
- request unsafe overspend action for block demo
- request LI.FI route preview if enabled
- receive approval/rejection callbacks

## Commands

The demo agent must target the wallet currently connected in the mobile app:

Before submitting actions, import this agent in the app for that wallet:

```text
Agent ID: agent-research
Display name: Research Agent
Allowed purpose: Demo Solana research agent that requests wallet-safe actions.
Mode: Ask every time
Max spend per action: 1
Daily cap: 5
Allowed protocols: helius,birdeye
Allowed mints: SOL,USDC
```

```bash
export SKILLGUARD_API_URL=http://localhost:8787
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm run submit:unsafe
npm run submit:safe
npm run submit:revoked
```

By default the CLI only submits actions to an existing connection. It never
receives the user's private key. For automated smoke tests without a phone, set
`SKILLGUARD_AUTO_CONNECT=1` to create the demo connection before submitting.
