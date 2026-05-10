# Strategy

Status: public rationale for choosing SkillGuard as the hackathon project.

## Verdict

SkillGuard is the stronger hackathon direction when the goal is a project that feels useful, mobile-native, sponsor-relevant, and less crowded.

The original Access402 direction is still a valid fallback or future module, but it is not the strongest main product unless it is reframed around a sharper use case.

## Why The Direction Changed

Before reviewing the current Solana agent-skill landscape, Access402 looked like a focused x402/Solana product.

After reviewing the ecosystem, the x402/pay-per-request category looked more crowded:

- pay-per-use API access for agents already exists.
- x402 data-agent and wallet-analysis workflows already exist.
- infrastructure providers already expose pay-per-request RPC or data products.
- several Solana x402 tools already cover the payment primitive itself.

That does not make x402 uninteresting. It removes the surprise from making payments the main pitch.

The stronger gap is control and safety around agent actions:

```text
AI agents can already discover Solana tools.
They still need a safe way to request wallet actions without receiving the user's private key.
```

## Comparison Matrix

| Criterion | Access402 | SkillGuard |
|---|---:|---:|
| Judge clarity | Medium | High |
| Originality after research | Medium/low | High |
| Solana requirement fit | High | High |
| Solana Mobile fit | Medium | High |
| x402 bonus fit | High | Medium |
| Devnet feasibility | High | High |
| Visual demo strength | Medium | High |
| Product usefulness | Medium/high | High |
| Risk of being seen as generic middleware | High | Low |

## Recommended Direction

Build SkillGuard as the main project:

```text
Agent permissions + mobile approvals + revocable wallet policies + on-chain audit receipts.
```

Use Access402 only as an optional extension:

- paid risk reports
- paid skill execution receipts
- reusable access receipts after a user pays for an agent tool

This lets SkillGuard benefit from x402 later without being defined by x402.

## Best Prize Targeting

Primary targets:

- Solana
- Solana Mobile

Secondary targets:

- developer tooling, if the SDK and API are clearly shown
- security/user-safety, if the demo emphasizes policy enforcement and revocation

Optional target:

- x402, if the paid risk-report module is revived after the core demo is stable

Not recommended:

- voice as a core product unless the mobile UX explicitly uses voice approvals
- generic analytics unless it strengthens the wallet-action safety story

## Winning Demo Shape

The demo story should stay simple:

1. An AI agent wants to use the user's Solana wallet.
2. Giving the agent a private key or funded throwaway wallet is the wrong tradeoff.
3. SkillGuard pairs the agent to the wallet owner with explicit policy.
4. A low-risk zero-spend request can pass under limits.
5. A spending request asks for mobile approval and creates a devnet receipt.
6. An unsafe request is blocked before wallet signing.
7. The user revokes the agent, and future requests are denied.

The pitch:

```text
AI agents can act on Solana, but SkillGuard makes them safe enough for real users.
```

## Implementation Priority

1. Action manifest format.
2. Agent signing and pairing.
3. Hosted API and policy evaluation.
4. Android approval app.
5. Mobile Wallet Adapter wallet signing.
6. Solana devnet receipt program.
7. Demo agent loop.
8. SDK and public integration docs.
9. Optional x402 paid risk-report module.

## Scope Boundary

SkillGuard should not claim universal wallet protection.

The credible claim is narrower and stronger:

```text
SkillGuard protects SkillGuard-mediated agent actions.
```

The MVP does not custody funds, does not expose private keys to agents, and does not prevent transactions signed outside SkillGuard. Its value is the controlled path: explicit pairing, policy checks, mobile approval, revocation, and auditable receipts.
