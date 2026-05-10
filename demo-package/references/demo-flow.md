# Demo Flow Reference

## Starting Point

The user has the Android app installed and connects a devnet wallet. A fresh
wallet starts with no imported agents and no active permissions.

The final video should not spend much time here. Show enough to prove the wallet
is connected and the app is real, then move to pairing.

## Pairing

The user opens Pair, scans the Research Agent QR, reviews policy defaults, and
signs the import challenge.

Default policy:

- Mode: Ask every time
- Max spend per action: `0.01 SOL`
- Daily cap: `0.05 SOL`
- Network: Solana devnet
- Protocols: Helius, Birdeye

## Agent Requests

Research Agent loop:

1. Free wallet scan:
   - Spend: `0 SOL`
   - Expected: manual approval when mode is `Ask every time`; automatic policy
     approval when mode is `Allow under limits`.
   - Video priority: recommended if clean. It explains how SkillGuard preserves
     autonomy without giving agents custody.
   - Boundary: no wallet signature and no SOL movement are needed for this path.

2. Paid report:
   - Spend: `0.001 SOL`
   - Expected: requires mobile approval because money moves.
   - Video priority: required.

3. Subscription upgrade:
   - Spend: `0.05 SOL`
   - Expected: blocked because it exceeds the `0.01 SOL` per-action limit.
   - Video priority: required.

## Revocation

The user revokes Research Agent from the app. Future requests are denied because
the agent connection is inactive.

Video priority: required. This is the cleanest proof that the wallet owner keeps
control after pairing.

## Recommended Recorded Order

1. Connect wallet on Solana devnet.
2. Pair Research Agent by QR and sign the import challenge.
3. Switch the agent to `Allow under limits`.
4. Show the free wallet scan auto-approval.
5. Show the paid `0.001 SOL` report requiring wallet approval.
6. Show the `0.05 SOL` upgrade blocked before signing.
7. Revoke the agent and show future requests denied.
