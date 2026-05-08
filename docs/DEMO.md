# Demo Script

Target length: under 3 minutes.

## Scene 1: Connect Wallet

Open SkillGuard mobile app and connect a devnet wallet using Mobile Wallet Adapter.

Show:

- wallet address
- devnet badge
- empty connected agents list

## Scene 2: Connect Agent

Open a connect link or QR for `Research Agent`.

Show permission setup:

- mode: Ask every time
- max spend: 0.05 SOL
- allowed protocols: SkillGuard demo, wallet analysis, LI.FI preview

## Scene 3: Unsafe Request

Research Agent submits an action over the spend limit.

Show:

- mobile request appears
- policy failure reason
- user rejects or app blocks
- rejection receipt recorded on devnet

## Scene 4: Safe Request

Research Agent submits a wallet-risk report request within policy.

Show:

- mobile action detail
- protocol list
- spend impact
- approve button
- Mobile Wallet Adapter signing
- approval receipt recorded on devnet

## Scene 5: Revoke Agent

User opens agent settings and revokes Research Agent.

Show:

- agent status changes to revoked
- future request is blocked

## Scene 6: Developer Integration

Show a small SDK snippet and webhook response.

Point:

```text
Any Solana agent can integrate SkillGuard without receiving the user's private key.
```
