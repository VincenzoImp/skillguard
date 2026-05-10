# SkillGuard Mobile

Android-first Expo app for wallet connection, agent permissions, action approvals, and receipt history.

## Current Stack

- Expo SDK 55
- React Native 0.83
- React 19
- Solana Mobile Wallet Adapter through `@wallet-ui/react-native-web3js`
- `@solana/web3.js` for the current mobile wallet flow
- `expo-camera` for default QR-based agent pairing
- `expo-notifications`, `expo-device`, and `expo-constants` for native push
  registration and notification tap routing
- `react-native-quick-crypto`, `react-native-get-random-values`, and `buffer` for Solana-compatible runtime primitives

## Current Screens

The current mobile slice uses live SkillGuard API state through a five-page
mobile shell:

- `Home`: wallet session status, live API state, pending/agent/blocked/history
  counters, refresh, connect, and disconnect actions
- `Inbox`: one selected pending action detail with approve/reject controls, plus
  a compact list of other pending requests when more than one exists
- `Agents`: active connected agent inventory, revoke action, and per-agent
  policy mode editing; revoked connections are removed from the active view
- `Pair`: default QR pairing scanner, manual pairing-link fallback, agent
  public key capture, approval mode, spend limits, protocol allowlist, and mint
  allowlist
- `Activity`: approved, rejected, blocked, and expired decision receipts,
  manifest hashes, and Explorer links when signatures exist

The product flows are:

- connect an MWA-compatible wallet on devnet
- show the connected wallet address
- start fresh wallets with zero connected agents
- create a short-lived wallet session through Solana sign-message before
  reading wallet-specific connections or actions
- register an Expo push token for the connected wallet session when native
  notifications are available
- import an agent by scanning a pairing QR, or by pasting a pairing link/ID as
  fallback, sign a wallet-owner challenge, and configure approval mode, spend
  limits, protocol allowlist, and mint allowlist
- edit the remote policy mode for each active agent
- review pending live agent requests without duplicating the selected request
- approve a pending request through a devnet SkillGuard `record_decision` transaction
- post approval metadata back to the API with transaction signature and receipt address
- reject a pending request through the API with wallet-owner proof
- revoke the connected agent through the API with wallet-owner proof and block future requests
- keep expired open manifests out of the actionable inbox and out of decision
  history unless the API recorded an explicit expired decision
- hide blocked cleanup outcomes produced by revoking already-expired pending
  requests, while still showing real non-expired policy blocks
- tap a native notification to refresh the live inbox and select the referenced
  action
- show decision receipts, manifest hashes, and Explorer links when signatures exist

Push notifications are a delivery channel only. The app always reloads the
authenticated live API feed before showing a notification-selected request, and
manual refresh remains the fallback for emulators, builds without notification
permission, or devices where Expo push is unavailable.

## Commands

Run commands through the repo environment so Node 22 and Android paths are selected:

```bash
. ../../scripts/dev-env.sh
npm test
npm run typecheck
npm run doctor
npm run android
```

For Android emulator against a local API, use:

```bash
EXPO_PUBLIC_SKILLGUARD_API_URL=http://10.0.2.2:8787 npm run android
```

For a hosted API, replace the value with the public endpoint:

```bash
EXPO_PUBLIC_SKILLGUARD_API_URL=https://skillguard-sol.vercel.app/api npm run android
```

Build the installable Android APK for local demo review:

```bash
. ../../scripts/dev-env.sh
../../scripts/build-mobile-apk.sh
```

The build script writes exactly one canonical APK and removes stale APKs from
`build/mobile` before copying the new artifact:

```text
<repo-root>/build/mobile/skillguard.apk
```

By default this is a standalone debug-signed APK with the JavaScript bundle
embedded and the hosted API endpoint baked in. Build the same canonical output
with the final upload keystore by using the release profile:

```bash
SKILLGUARD_ANDROID_BUILD_PROFILE=release \
SKILLGUARD_ANDROID_KEYSTORE_PATH=/absolute/path/to/skillguard-upload.jks \
SKILLGUARD_ANDROID_KEYSTORE_PASSWORD=... \
SKILLGUARD_ANDROID_KEY_ALIAS=skillguard-upload \
SKILLGUARD_ANDROID_KEY_PASSWORD=... \
../../scripts/build-mobile-apk.sh
```

The release profile still writes `<repo-root>/build/mobile/skillguard.apk`.
Do not commit `.jks` files or secret signing properties.
The generated APK and native `android/` directory are local artifacts and are ignored by git.

## MWA Verification

Manual Android verification passed on May 9, 2026 using the official Solana Mobile mock MWA wallet on emulator `skillguard_api36`.

The app authorized wallet `Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx` on devnet and submitted a SkillGuard program transaction through Mobile Wallet Adapter. Agent import now also requires a Solana sign-message owner proof before the API creates the connection. The approval transaction created the user profile, connected the demo agent on-chain, and recorded an approval receipt:

```text
Signature: 5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF
Action receipt: 7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z
Status: finalized on devnet
```

## Audit Note

`npm audit --omit=dev` passes with zero known vulnerabilities. The mobile
package pins Expo 55-compatible dependencies and uses an npm `overrides`
entry for PostCSS so Expo/Metro tooling receives the patched 8.5.x line
without downgrading Expo.
