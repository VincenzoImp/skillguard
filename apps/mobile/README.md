# SkillGuard Mobile

Android-first Expo app for wallet connection, agent permissions, action approvals, and receipt history.

## Current Stack

- Expo SDK 55
- React Native 0.83
- React 19
- Solana Mobile Wallet Adapter through `@wallet-ui/react-native-web3js`
- `@solana/web3.js` for the current mobile wallet flow
- `react-native-quick-crypto`, `react-native-get-random-values`, and `buffer` for Solana-compatible runtime primitives

## Current Screen

The first mobile slice is a wallet connection and signing probe:

- connect an MWA-compatible wallet on devnet
- show the connected wallet address
- show a SkillGuard approval preview
- sign and send a devnet Memo transaction
- show the transaction signature and open it in Solana Explorer

## Commands

Run commands through the repo environment so Node 22 and Android paths are selected:

```bash
. ../../scripts/dev-env.sh
npm run typecheck
npm run doctor
npm run android
```

## Audit Note

`npm audit --omit=dev` currently reports moderate PostCSS findings through Expo/Metro tooling. `npm audit fix --force` proposes downgrading Expo to an older major version, so it is rejected for the MVP. The project keeps Expo 55-compatible dependencies and tracks this as a tooling dependency risk, not an application runtime feature.
