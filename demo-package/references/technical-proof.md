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
3. Low-risk zero-spend manifests can pass policy without wallet signing.
4. Mobile app loads pending spending requests through a signed wallet session.
5. Mobile Wallet Adapter signs approvals when the owner approves.
6. Anchor program records wallet-approved decision receipts on Solana devnet.

## Proof To Show In The Video

Use short proof cards, not long logs:

- Android APK
- Mobile Wallet Adapter
- Hosted Vercel API
- Research Agent worker
- Anchor receipt program
- Solana devnet receipt

## Honest Boundary

SkillGuard protects requests that go through SkillGuard. It does not claim to
protect arbitrary transactions signed outside the system, and it does not hold
custody of user funds. It also does not auto-sign spending transactions in the
MVP. Auto-approval is limited to low-risk zero-spend requests.
