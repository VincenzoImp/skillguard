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

The current mobile slice uses live SkillGuard API state for the product screens:

- connect an MWA-compatible wallet on devnet
- show the connected wallet address
- create or load the connected Research Agent for that wallet
- edit the remote policy mode
- review pending, blocked, approved, and rejected live agent requests
- approve a pending request through a devnet SkillGuard `record_decision` transaction
- post approval metadata back to the API with transaction signature and receipt address
- reject a pending request through the API without wallet signing
- revoke the connected agent through the API and block future requests
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

The app authorized wallet `Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx` on devnet and submitted a SkillGuard program transaction through Mobile Wallet Adapter. The transaction created the user profile, connected the demo agent, and recorded an approval receipt:

```text
Signature: 5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF
Action receipt: 7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z
Status: finalized on devnet
```

## Audit Note

`npm audit --omit=dev` currently reports moderate PostCSS findings through Expo/Metro tooling. `npm audit fix --force` proposes downgrading Expo to an older major version, so it is rejected for the MVP. The project keeps Expo 55-compatible dependencies and tracks this as a tooling dependency risk, not an application runtime feature.
