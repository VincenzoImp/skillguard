# SkillGuard Mobile

Android-first Expo app for wallet connection, agent permissions, action approvals, and receipt history.

## Current Stack

- Expo SDK 55
- React Native 0.83
- React 19
- Solana Mobile Wallet Adapter through `@wallet-ui/react-native-web3js`
- `@solana/web3.js` for the current mobile wallet flow
- `react-native-quick-crypto`, `react-native-get-random-values`, and `buffer` for Solana-compatible runtime primitives

## Current Screens

The current mobile slice combines the wallet connection spike with the first product demo screens:

- connect an MWA-compatible wallet on devnet
- show the connected wallet address
- show the connected Research Agent
- edit the demo policy mode
- review pending and blocked agent requests
- approve a pending request through a devnet SkillGuard `record_decision` transaction
- reject a pending request without wallet signing
- revoke the connected agent and block future requests
- show decision receipts, manifest hashes, and Explorer links when signatures exist

## Commands

Run commands through the repo environment so Node 22 and Android paths are selected:

```bash
. ../../scripts/dev-env.sh
npm test
npm run typecheck
npm run doctor
npm run android
```

Build an installable Android APK for local demo review:

```bash
. ../../scripts/dev-env.sh
../../scripts/build-mobile-apk.sh
```

The default output is a debug-signed APK at:

```text
<repo-root>/build/mobile/skillguard-debug.apk
```

Build a standalone local APK with the JavaScript bundle embedded:

```bash
SKILLGUARD_ANDROID_BUILD_PROFILE=standalone ../../scripts/build-mobile-apk.sh
```

Standalone local output:

```text
<repo-root>/build/mobile/skillguard-standalone-debugsigned.apk
```

Release signing for store submission still needs a real keystore and signing config.
Do not commit `.jks` files or secret signing properties.
The generated APK and native `android/` directory are local artifacts and are ignored by git.

## MWA Verification

Manual Android verification passed on May 9, 2026 using the official Solana Mobile mock MWA wallet on emulator `skillguard_api36`.

The app authorized wallet `Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx` on devnet and submitted a SkillGuard program transaction through Mobile Wallet Adapter. The transaction created the user profile, connected the demo agent, and recorded an approval receipt:

```text
Signature: 5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF
Action receipt: 7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z
Status: finalized on devnet
```

## Audit Note

`npm audit --omit=dev` currently reports moderate PostCSS findings through Expo/Metro tooling. `npm audit fix --force` proposes downgrading Expo to an older major version, so it is rejected for the MVP. The project keeps Expo 55-compatible dependencies and tracks this as a tooling dependency risk, not an application runtime feature.
