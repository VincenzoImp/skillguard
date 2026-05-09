# Critical Feasibility Study

Date: 2026-05-08

## Verdict

SkillGuard is worth building for the hackathon, but only as a narrow, honest vertical slice:

```text
Agent proposes Solana action -> SkillGuard evaluates policy -> user approves/rejects on mobile -> receipt is recorded on Solana devnet.
```

The project should not be pitched as wallet-wide protection for every possible signing path. The credible pitch is stronger and more defensible:

```text
The permission layer for Solana agents.
```

This is a good hackathon project because it joins three visible needs:

- Solana agents can already perform many protocol-specific actions.
- Users still need a clear approval and revocation layer before agents touch wallets.
- Solana Mobile gives the project a concrete mobile-first prize angle.

## External Facts Checked

Primary sources reviewed:

- Solana Mobile Mobile Wallet Adapter docs: Android is fully supported, Mobile Web Chrome on Android is supported, iOS is not currently supported, and SDKs exist for Kotlin, React Native, Flutter, Unity, and Unreal.
- Solana Mobile development setup: a Solana Mobile device is not required; a standard Android device or emulator is acceptable for development.
- Solana Mobile React Native installation docs: `@wallet-ui/react-native-web3js` is the current integration route for React Native apps.
- Solana official JavaScript docs: `@solana/kit` is the recommended TypeScript SDK, while `@solana/web3.js` is legacy.
- Solana installation docs: the quick installer can install Rust, Solana CLI, Anchor CLI, Surfpool, Node, and Yarn.
- Anchor docs: Anchor remains the standard framework for Solana programs and supports `anchor init`, `anchor build`, `anchor deploy`, and `anchor test`.

Source URLs:

- https://docs.solanamobile.com/developers/mobile-wallet-adapter
- https://docs.solanamobile.com/get-started/react-native/installation
- https://docs.solanamobile.com/get-started/web/apps
- https://solana.com/docs/clients/official/javascript
- https://solana.com/docs/intro/installation
- https://www.anchor-lang.com/docs/installation
- https://www.anchor-lang.com/docs/quickstart

## Local Feasibility Tests

Commands run locally on 2026-05-08:

| Check | Result | Meaning |
|---|---|---|
| `node -v` | `v25.7.0` | Node is available. |
| `. scripts/dev-env.sh && node -v` | `v22.22.2` | Repo verification uses Node 22 because the generated Anchor test runner currently fails under Node 25 ESM behavior. |
| `npm -v` | `11.10.1` | npm is available. |
| `pnpm -v` | `10.33.4` | pnpm is available. |
| `rustc --version` | `rustc 1.95.0` | Rust is available after the Solana quick installer update. |
| `cargo --version` | `cargo 1.95.0` | Cargo is available after the Solana quick installer update. |
| `solana --version` | `solana-cli 3.1.15` | Solana CLI is available. |
| `anchor --version` | `anchor-cli 0.32.1` | Anchor CLI is available. |
| `surfpool --version` | `surfpool 1.2.1` | Surfpool is available, but the installer logged a requested-version mismatch for `1.1.2`. Not a blocker for the MVP receipt flow. |
| `solana config get` | devnet RPC configured | Local Solana CLI now points to `https://api.devnet.solana.com`. |
| `java -version` | OpenJDK `17.0.19` | JDK is available after Homebrew setup. |
| `adb version` | Android Debug Bridge `37.0.0` | Android device bridge is available. |
| `emulator -version` | Android emulator `36.5.11.0` | Android emulator CLI is available. |
| `sdkmanager --list_installed` | Android SDK 36 packages installed | Platform tools, build tools, emulator, Android 36 platform, and ARM64 Google Play system image are installed. |
| `avdmanager list avd` | `skillguard_api36` exists | A Google Play ARM64 emulator profile is available for mobile testing. |
| `gradle --version` | missing | Gradle is not globally installed; Expo/Android builds should use project-managed Gradle wrappers once the mobile app is scaffolded. |
| `apps/site npm run build` | passed | Current project site foundation is healthy. |
| `programs/skillguard anchor test` | 12 tests passed under Node `22.22.2` | Anchor program compiles, starts the local validator, and covers profiles, agent connections, policy create/update, revocation, receipts, execution signatures, invalid decision codes, and negative cases. |
| `programs/skillguard npm audit --omit=dev` | 0 vulnerabilities | Runtime dependency audit is clean; reported Anchor template audit findings are limited to dev/test dependencies. |
| `apps/mobile npm run typecheck` | passed | The Expo wallet connection and SkillGuard `record_decision` transaction path compile under TypeScript. |
| `apps/mobile npm test` | 11 tests passed | Local mobile tests cover live API client calls, API-to-mobile state mapping, SkillGuard PDA derivation, and `record_decision` instruction serialization. |
| `apps/mobile npm run doctor` | 18/18 checks passed | The mobile dependency graph is Expo SDK 55-compatible after pinning React, React Native, random values, and quick base64 versions. |
| `apps/mobile npm audit --omit=dev` | 4 moderate findings | Current findings are PostCSS issues through Expo/Metro. `npm audit fix --force` proposes an Expo major downgrade, so this is tracked as an upstream tooling dependency risk rather than applied blindly. |
| `apps/demo-agent npm test` | 6 tests passed | Demo agent manifest generation, connected-wallet targeting, connection creation, and API client request flow are covered. |
| `apps/demo-agent npm run build` | passed | Demo agent CLI compiles under TypeScript NodeNext. |
| `apps/demo-agent submit:*` against local API | passed | Safe returns `requires_approval`, unsafe returns `fail` with `spend_exceeds_max`, and revoked returns `fail` with revocation reasons. |
| `packages/sdk npm test` | 2 tests passed | SDK submit and decision-read flows are covered with injected fetch. |
| `packages/sdk npm run build` | passed | SDK package compiles under TypeScript NodeNext. |

Toolchain update on 2026-05-08:

- Official Solana quick installer completed with exit code 0.
- `solana` is available at `~/.local/share/solana/install/active_release/bin/solana`.
- `anchor` and `avm` are available from `~/.cargo/bin`.
- `solana config set --url devnet` succeeded.
- The current shell still needs the Solana binary path exported until a new terminal reads the installer PATH update.

Android tooling update on 2026-05-08:

- Installed or upgraded `openjdk@17`, `android-commandlinetools`, and `android-platform-tools` with Homebrew.
- Accepted Android SDK licenses through `sdkmanager`.
- Installed Android SDK packages: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`, `emulator`, and `system-images;android-36;google_apis_playstore;arm64-v8a`.
- Created AVD `skillguard_api36` at `~/.android/avd/skillguard_api36.avd`.
- Added `scripts/dev-env.sh` so repo commands can source the verified Solana and Android paths.
- Android Studio is still not installed; CLI/emulator tooling is enough for the first Expo/React Native build spike, while Android Studio may still help for emulator/device management.

Solana program tooling update on 2026-05-08:

- Replaced the placeholder `programs/skillguard` directory with an Anchor workspace from `anchor init skillguard --no-git --package-manager npm`.
- Generated a local Solana development keypair at `~/.config/solana/id.json` so `anchor test` can fund and run against the local validator. The keypair is outside the repo and must never be committed.
- `anchor test` passes the SkillGuard receipt program test suite when `scripts/dev-env.sh` selects Node `22.22.2`.
- Anchor's generated JavaScript dependency tree currently emits a Node deprecation warning for `punycode`; this is dependency noise, not a program failure.
- `npm install` for the generated Anchor workspace reports six dependency audit findings in the dev/test dependency tree. `npm audit --omit=dev` reports 0 vulnerabilities, so the current runtime dependency surface is clean while dev tooling must still be reviewed before production hardening.

Current package versions checked from npm:

| Package | Version |
|---|---:|
| `@solana/kit` | `6.9.0` |
| `@coral-xyz/anchor` | `0.32.1` |
| `@solana/web3.js` | `1.98.4` |
| `@wallet-ui/react-native-web3js` | `4.1.0` |
| `expo` | `55.0.23` |
| `react-native` | `0.83.6` |
| `react` | `19.2.0` |
| `expo-dev-client` | `55.0.32` |
| `react-native-quick-crypto` | `1.1.2` |

Mobile spike update on 2026-05-08:

- Replaced the placeholder `apps/mobile` directory with an Expo TypeScript app.
- Added a Solana Mobile Wallet Adapter provider using devnet.
- Added a wallet connection screen that shows SkillGuard branding, devnet state, wallet address, approval preview, and a SkillGuard `record_decision` approval transaction.
- Added runtime polyfills for random values and Buffer.
- `expo-doctor` initially caught incompatible React Native, React, and random-values versions; the dependency graph was corrected to Expo SDK 55-compatible versions.
- Added mobile product screens for connected agent, policy editor, inbox, action detail, and decision receipts backed by live SkillGuard API state.
- Manual Android wallet verification passed on May 9, 2026 with the official Solana Mobile mock MWA wallet on emulator `skillguard_api36`.
- The app authorized devnet wallet `Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx` and submitted finalized devnet signature `5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF`, which created profile `7DrEwjK8YhEDz1K46qtvFFrYzjkvJKVvyptsubS1jQr9`, connection `BEhjLvVgmCUHC3aa7T3yaAhxQ15BWEL9pFCbDdkkDQfr`, and receipt `7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z`.

Demo agent update on 2026-05-08:

- Added `apps/demo-agent` CLI scripts for `submit:safe`, `submit:unsafe`, and `submit:revoked`.
- The CLI requires `SKILLGUARD_USER_WALLET`, creates or updates the matching Research Agent connection, posts ActionManifest payloads to the API, and immediately requests policy evaluation.
- The revoked demo path revokes the demo connection first, then submits an action that should evaluate as blocked by policy revocation.
- Local tests cover manifest generation and HTTP request order.
- A local API smoke test confirmed the three CLI paths return the expected policy statuses.

SDK update on 2026-05-08:

- Added `packages/sdk` with `createSkillGuardClient`, `submitAction`, and `onDecision`.
- The README now includes an agent-developer snippet under 15 lines.
- Local tests cover authenticated submit headers and one-shot decision reads.

## Critical Evaluation

### What Makes Sense

SkillGuard solves a real gap: agents are becoming capable, but wallet authorization is still either manual and unclear or dangerously delegated. A mobile approval inbox with policy checks is easy to understand in a demo and directly relevant to Solana Mobile.

The project also benefits from being composable. It can sit in front of Solana Agent Kit, Phantom Wallet MCP, Jupiter, Helius, LI.FI route previews, or any custom agent. That is stronger than building one more protocol-specific agent.

### What Does Not Make Sense

The project does not make sense if it tries to implement all of these in the MVP:

- universal transaction firewall
- full autonomous wallet delegation
- mainnet token spending
- production push notifications
- full dApp Store submission
- cross-chain LI.FI execution
- x402 monetization
- full wallet simulation engine

Those features either expand the blast radius or create operational risk without making the core demo clearer.

### Honest Security Boundary

SkillGuard can enforce policy only for actions routed through SkillGuard.

It cannot:

- stop a user from signing a similar transaction elsewhere
- protect a wallet if an agent already has a private key
- guarantee downstream protocol behavior from a short transaction summary
- replace wallet-level transaction simulation

This boundary should be in the README, pitch, and demo. It makes the project more credible.

## Recommended MVP

Build one polished vertical slice:

```text
Research Agent submits two action manifests:
1. unsafe overspend request -> blocked/rejected -> rejection receipt
2. safe wallet-risk receipt request -> approved on mobile -> devnet receipt
```

The demo must show:

- user connects wallet on Android through Mobile Wallet Adapter
- user connects a demo agent
- user sets permission policy
- agent submits unsafe action
- SkillGuard explains why it is blocked
- user rejects or app blocks it
- rejection receipt is written to devnet
- agent submits safe action
- user approves on mobile
- receipt transaction is signed through wallet
- receipt appears with manifest hash and Explorer link
- user revokes the agent
- future request from the revoked agent is blocked

## Feature Priority

### P0: Must Build

1. Shared action manifest schema.
2. Deterministic manifest hashing.
3. Policy engine with unit tests.
4. API with seeded demo agent and pending actions.
5. Anchor receipt program on localnet/devnet.
6. Mobile app with wallet connect and approval UI.
7. Demo agent that submits safe and unsafe actions.
8. Receipt timeline with manifest hash and transaction signature.
9. Demo script and README.

### P1: Build Only After P0 Works

1. QR connect link.
2. Push notification wrapper.
3. LI.FI route preview only, no execution.
4. x402 paid risk report simulation.
5. Receipt verifier page.

### Cut From MVP

1. Mainnet execution.
2. Auto-spending session keys.
3. Real delegated trading.
4. Multi-agent marketplace.
5. Full production auth.
6. dApp Store submission automation.

## Feasibility By Component

| Component | Feasibility | Risk | Recommendation |
|---|---:|---:|---|
| Shared protocol/types | High | Low | Build first. |
| Policy engine | High | Low | Unit-test heavily. |
| API | High | Low | Use local SQLite or JSON DB for MVP. |
| Anchor receipt program | Medium/high | Medium | Requires Solana CLI and Anchor install. |
| Android app | Medium | High | Requires JDK/Android setup and MWA spike. |
| Mobile Wallet Adapter signing | Medium | High | Run spike before UI polish. |
| Demo agent | High | Low | Use fixtures first, real agent integration later. |
| LI.FI/x402 bonus | Medium | Medium/high | Optional only after P0. |

## Required Spikes

### Spike 1: Toolchain

Goal: confirm Solana and Android development can run locally.

Commands:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
rustc --version
solana --version
anchor --version
node --version
java -version
```

Pass criteria:

- Solana CLI available.
- Anchor CLI available.
- JDK available.
- `solana config set --url devnet` works.

### Spike 2: Anchor Receipt

Goal: record one receipt account locally.

Commands:

```bash
anchor init skillguard-anchor-spike
cd skillguard-anchor-spike
anchor test
```

Pass criteria:

- Anchor local test compiles and runs.
- One custom receipt account can be created.

Current status:

- The Anchor workspace compiles and runs with `anchor test` under Node 22.
- The custom `ActionReceipt` account is implemented and covered by approval, rejection, invalid-decision, revoked-agent, duplicate-action, and execution-signature tests. Agent policy creation and later permission updates are covered as well.

### Spike 3: Mobile Wallet Adapter

Goal: connect and sign one devnet transaction from Android.

Pass criteria:

- Expo/React Native app runs on Android emulator or device.
- MWA-compliant wallet is installed.
- App authorizes wallet.
- App signs or sign-and-sends one devnet memo/receipt transaction.

Cut line:

- If MWA blocks more than one focused work session, ship web approval UI plus on-chain receipt as fallback, while keeping Android as stretch.

### Spike 4: End-To-End Happy Path

Goal: prove the core product loop without polish.

Pass criteria:

- Demo agent posts action.
- API evaluates policy.
- Mobile or web UI approves.
- Receipt transaction is created and signed.
- Receipt signature is shown in UI.

## Hackathon Judging Strategy

The strongest judging story is:

```text
Solana agents are powerful. SkillGuard gives users a mobile control layer before those agents touch wallets.
```

Judges should understand the product in 20 seconds:

1. Here is an agent asking to use my wallet.
2. Here are the exact permissions I gave it.
3. Here is a dangerous request blocked.
4. Here is a safe request approved on mobile.
5. Here is the Solana receipt proving the decision.
6. Here is revocation.

## Go / No-Go

Proceed with SkillGuard if:

- shared policy engine works by tests
- Anchor receipt program works on localnet or devnet
- either Android MWA works or fallback web signing works
- demo agent can create clear safe/unsafe requests

Switch or reduce scope if:

- Android/MWA blocks too long
- Solana CLI/Anchor setup cannot be completed
- receipt program cannot be deployed/tested
- the demo cannot be explained without long caveats

## Final Recommendation

Proceed. The project is promising, but the implementation must be ruthless:

1. Build policy engine first.
2. Prove on-chain receipt second.
3. Prove mobile signing third.
4. Only then polish the UI and add optional integrations.
