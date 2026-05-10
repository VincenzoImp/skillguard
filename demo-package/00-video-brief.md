# Video Brief

## Audience

Hackathon judges who need to understand the need, the product, the demo, and the
technical credibility quickly.

## One-Sentence Pitch

SkillGuard gives AI agents wallet access without giving up control: agents can
request onchain actions, but a wallet-owned firewall decides what is allowed,
what needs consent, what is blocked, and what can be revoked.

## The Need

AI agents are becoming capable of operating onchain. They can research wallets,
monitor markets, route transactions, pay for reports, claim rewards, and prepare
execution. But the moment an agent needs wallet authority, the user faces a bad
tradeoff:

- Give the agent a wallet or signer and risk real funds.
- Fund a separate wallet and still risk those funds.
- Manually approve every transaction and lose the benefit of autonomy.

SkillGuard fills the missing layer: user-owned consent and policy between the
agent and the wallet.

## Demo Promise

In under three minutes, show:

1. The opening hook frames the danger: useful agents need wallet access.
2. The user pairs Research Agent by QR.
3. A low-risk zero-spend request can auto-approve under policy.
4. The agent asks for a paid `0.001 SOL` report that requires mobile approval.
5. The wallet signs only after the owner approves in SkillGuard.
6. A larger `0.05 SOL` request is blocked before signing.
7. The owner revokes the agent.
8. A Solana devnet receipt proves the paid approval is a real mediated wallet flow.

Important boundary: do not claim SkillGuard auto-signs spending transactions.
Auto-approval only applies to low-risk zero-spend requests in this MVP.

## The Three-Minute Spine

```text
0:00-0:20  Problem: agents need wallets, but raw wallet access is dangerous.
0:20-0:45  Tradeoff: personal wallet, funded burner, manual approval.
0:45-1:10  Solution: SkillGuard is the wallet firewall.
1:10-2:25  Live proof: pair, auto-allow zero-spend, approve spend, block, revoke.
2:25-2:45  Technical proof: Android, MWA, Vercel API, agent worker, devnet receipt.
2:45-2:55  Close: agents can act; users stay in control.
```

## Desired Tone

Calm, credible, technical, and urgent. Avoid hype. The product should feel like
infrastructure for the next wave of onchain AI agents, not a conceptual mockup.
