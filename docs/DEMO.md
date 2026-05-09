# Demo Script

Target length: under 3 minutes.

## Full Local Script

```bash
. scripts/dev-env.sh
scripts/dev-demo.sh
```

`scripts/dev-demo.sh` starts the local API and site, then waits. It does not
submit wallet actions before the app has a connected wallet. Connect a wallet in
the Android app first, copy the full wallet address, then submit agent requests
with that exact address.

## Hosted Smoke

After each Vercel production deploy, run the smoke against the public API:

```bash
node scripts/hosted-smoke.mjs
```

This uses a generated smoke wallet and proves the hosted API, Upstash storage,
research-agent integration, rejection, overspend blocking, revocation blocking, and
wallet action history without needing a phone. The smoke script deletes its
generated `SmokeWallet...` agent, connection, and actions after the run; cleanup
failure makes the smoke fail.

## Hosted Mobile Demo

Use this for the final recorded app demo:

```bash
EXPO_PUBLIC_SKILLGUARD_API_URL=https://skillguard-sol.vercel.app/api \
  npm --prefix apps/mobile run android

export SKILLGUARD_API_URL=https://skillguard-sol.vercel.app/api
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm --prefix apps/research-agent run agent:loop
```

The wallet address must be the exact address shown in the Android app after
Mobile Wallet Adapter connection. The research agent never receives the private key.
Before running those commands, import `agent-research` in the mobile app with
the pairing link below, sign the wallet-owner challenge, and keep the default
conservative policy: ask every time, `0.01 SOL` max spend per action,
`0.05 SOL` daily cap, `helius,birdeye`, and `SOL`.

The APK registers an Expo push token after the wallet session is signed. On a
physical Android build with notification permission enabled, pending agent
requests appear as native notifications. Tapping a notification opens the
SkillGuard inbox with that action selected. If push delivery is unavailable for
the local build or device, use the app's `Refresh` action; the live API feed is
the source of truth.

```text
skillguard://pair?agentId=agent-research&name=Research%20Agent&description=Solana%20research%20agent%20that%20requests%20wallet-safe%20actions.&protocols=helius,birdeye&publicKey=9hSR6S7WPtxmTojgo6GG3k4yDPecgJY292j7xrsUGWBu
```

## Manual Commands

```bash
npm --prefix apps/api run dev

EXPO_PUBLIC_SKILLGUARD_API_URL=http://10.0.2.2:8787 \
  npm --prefix apps/mobile run android

export SKILLGUARD_API_URL=http://localhost:8787
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm --prefix apps/research-agent run agent:loop

# Lower-level smoke commands remain available:
npm --prefix apps/research-agent run submit:unsafe
npm --prefix apps/research-agent run submit:safe
npm --prefix apps/research-agent run submit:revoked
```

## Spoken Lines

```text
"This agent is asking to use my wallet."
"SkillGuard checks it against my policy before I sign anything."
"This one is blocked because it exceeds my limit."
"This one is safe, so I approve it from mobile."
"The decision is now recorded as a Solana devnet receipt."
"Now I revoke the agent, and future requests are blocked."
```

## Scene 1: Connect Wallet

Open SkillGuard mobile on the `Home` tab and connect a devnet wallet through
Mobile Wallet Adapter. Sign the wallet-session message, then show the wallet
address, devnet badge, live API badge, and zero-agent counters. Move to `Pair`,
paste the `agent-research` pairing link, review the policy, sign the import
challenge, then move to `Agents` and show the connection that was created by the
wallet owner.

## Scene 2: Unsafe Request

Run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
  npm --prefix apps/research-agent run agent:loop
```

The loop first submits a free wallet scan. Approve it from `Inbox` or by
tapping the notification, then wait for the next request. The second request is
a paid report under the default `0.01 SOL` max and can be approved. The third
request is a subscription upgrade over the max and is blocked before wallet
signing. Say: "This one is blocked because it exceeds my limit."

## Scene 3: Safe Request

Open the pending paid report, show the requested `0.001 SOL` spend, approve it
through the wallet, then move to `Activity` and open the devnet SkillGuard
receipt transaction. The mobile approval transaction includes the SOL transfer
and the SkillGuard `record_decision` receipt.

## Scene 4: Revoke Agent

Revoke Research Agent in mobile, then run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
  npm --prefix apps/research-agent run submit:revoked
```

Open `Agents`, revoke Research Agent, then show in `Inbox` that the future
request is blocked because the policy is inactive/revoked.

## Scene 5: Developer Integration

Show the README SDK snippet.

```text
Any Solana agent can integrate SkillGuard without receiving the user's private key.
```

## Product Intent

The APK is meant to be installable by anyone. A newly connected wallet starts
with no agents, no permissions, and no inbox items. The user imports or creates
an agent, sets the policy, and can revoke or edit that policy later. Agents use
the hosted API or SDK to submit wallet action manifests; the mobile app is the
user-controlled approval center. Wallet feeds are loaded through a short-lived
signed wallet session, so arbitrary callers cannot read another wallet's inbox
through the public API. Native Expo push notifications are implemented as a
delivery channel for pending requests; the authenticated live inbox remains the
source of truth.
