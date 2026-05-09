# App Recording Guide

Capture only short proof inserts. The final video should not be a raw app
walkthrough.

## Setup

1. Install `build/mobile/skillguard.apk`.
2. Open the app on Android.
3. Connect the devnet wallet through Mobile Wallet Adapter.
4. Ensure the wallet has enough devnet SOL for the paid request. Use at least
   `0.01 SOL`.
5. Run:

```bash
scripts/live-demo.sh <connected-mobile-wallet-address>
```

## Clips To Capture

### Clip 1: Pairing

- Start: Pair tab, QR scanner open.
- Action: scan the Research Agent QR.
- End: agent imported and visible in Agents.
- Length: 8-12 seconds.

### Clip 2: Paid Approval

- Start: Inbox with Research Agent paid report.
- Show: spend `0.001 SOL`, policy checks, approve button.
- Action: approve through wallet.
- End: Activity with receipt.
- Length: 15-20 seconds.

### Clip 3: Block And Revoke

- Start: blocked overspend visible or Activity showing blocked result.
- Show: Agents tab and revoke action.
- End: revoked agent state.
- Length: 10-15 seconds.

## Recording Notes

- Do not expose recovery material, signing credentials, local signing files, or
  credential vault data.
- It is fine to show public wallet addresses and devnet signatures.
- Crop out Android notification shade unless it helps prove push behavior.
- Keep tap speed calm. The voiceover will explain the action.
