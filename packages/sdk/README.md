# SkillGuard SDK

TypeScript SDK for agent developers.

Example target API:

```ts
const skillguard = new SkillGuardClient({ apiKey });

await skillguard.requestApproval({
  agentId: "research-agent",
  userWallet: "7xK...",
  action: {
    type: "wallet_risk_report",
    summary: "Generate a wallet risk snapshot",
    protocols: ["skillguard"],
    estimatedSpend: { mint: "SOL", amount: "0.005" },
  },
  callbackUrl: "https://agent.example.com/callback",
});
```
