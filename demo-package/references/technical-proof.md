# Technical Proof

The demo is not only a storyboard. These parts exist in the repository:

- Android app: `apps/mobile`
- Hosted site/API: `https://skillguard-sol.vercel.app`
- Agent worker: `apps/research-agent`
- SDK package: `packages/sdk`
- Protocol package: `packages/protocol`
- Anchor program: `programs/skillguard`
- Canonical APK: `build/mobile/skillguard.apk`

## Real Flow

1. Research Agent submits an ActionManifest.
2. API evaluates the wallet-owned policy.
3. Mobile app loads pending requests through a signed wallet session.
4. Mobile Wallet Adapter signs approvals.
5. Anchor program records decision receipts on Solana devnet.

## Honest Boundary

SkillGuard protects requests that go through SkillGuard. It does not claim to
protect arbitrary transactions signed outside the system, and it does not hold
custody of user funds.
