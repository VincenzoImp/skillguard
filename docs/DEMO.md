# Demo Script

Target length: under 3 minutes.

The complete video handoff for an external AI presentation/video agent lives in
`demo-package/`. It is intentionally flat and compact, with 6 files total, so it
can be imported into agents with a strict file limit.

For the final video agent, start with:

```text
demo-package/00_READ_THIS_FIRST_PROMPT.md
demo-package/01_STORY_SCRIPT_AND_SHOTS.md
demo-package/02_VISUAL_COMPONENTS_AND_TECH_PROOF.md
```

Those files define the three-minute spine: problem, bad tradeoff, SkillGuard as
wallet firewall, then the live proof sequence of pair, low-risk zero-spend
auto-approval, paid approval, block, and revoke.

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
scripts/live-demo.sh <connected-mobile-wallet-address>
```

The wallet address must be the exact address shown in the Android app after
Mobile Wallet Adapter connection. `scripts/live-demo.sh` opens the styled live
Research Agent pairing QR, waits until the app shows the imported agent, and
only then starts the autonomous request loop. The research agent never receives
the user's private key.

Fund the demo wallet with at least `0.01 SOL` on devnet before the paid request.
The second approval is a real devnet transaction: it pays the `0.001 SOL`
research quota, creates a new on-chain receipt account, and pays the network fee.
If the balance is too low, the APK now stops before wallet signing and shows the
required amount.

The QR only fills the agent identity; the wallet owner still reviews the policy
and signs the import challenge. Keep the default conservative policy for the
first pass: ask every time, `0.01 SOL` max spend per action, `0.05 SOL` daily
cap, `helius,birdeye`, and `SOL`. To demonstrate auto-approval, switch only this
agent to `Allow under limits`; only low-risk zero-spend requests can auto-approve.

If camera access is unavailable, use the manual fallback and paste:

```text
skillguard://pair?agentId=agent-research-live-230105&name=Research+Agent+Live&description=Solana+research+agent+that+requests+wallet-safe+actions.&protocols=helius%2Cbirdeye&publicKey=CWYnjAvQF85gAHtAWZETH2DcD1WQbRfTaf64Xvu1juZF
```

The APK registers an Expo push token after the wallet session is signed. On a
physical Android build with notification permission enabled, pending agent
requests appear as native notifications. Tapping a notification opens the
SkillGuard inbox with that action selected. If push delivery is unavailable for
the local build or device, use the app's `Refresh` action; the live API feed is
the source of truth.

## Manual Commands

```bash
npm --prefix apps/api run dev

EXPO_PUBLIC_SKILLGUARD_API_URL=http://10.0.2.2:8787 \
  npm --prefix apps/mobile run android

export SKILLGUARD_API_URL=http://localhost:8787
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
export SKILLGUARD_AGENT_PRIVATE_KEY_B58=<agent-secret-key-from-password-manager>
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
"Low-risk zero-spend requests can auto-approve, but spending still needs my wallet."
"This one spends SOL, so I approve it from mobile."
"The decision is now recorded as a Solana devnet receipt."
"Now I revoke the agent, and future requests are blocked."
```

## Video Pitch Priority

The first 10 seconds should make the risk obvious: useful agents need wallet
access, but direct signer access puts funds at risk. Do not open the video with
API routes, code snippets, or Solana architecture. Those are proof points for
the last third of the video, after the product value is clear.

## Scene 1: Connect Wallet

Open SkillGuard mobile on the `Home` tab and connect a devnet wallet through
Mobile Wallet Adapter. Sign the wallet-session message, then show the wallet
address, devnet badge, live API badge, and zero-agent counters. Move to `Pair`,
tap `Scan QR`, scan the Research Agent QR from the developer page, review the
policy, sign the import challenge, then move to `Agents` and show the
connection that was created by the wallet owner.

## Scene 2: Unsafe Request

Run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
  npm --prefix apps/research-agent run agent:loop
```

The loop first submits a free wallet scan. With `Ask every time`, approve it
from `Inbox` or by tapping the notification. With `Allow under limits`, the same
low-risk zero-spend request is auto-approved and appears in `Activity` as
receipt-only.
The second request is a paid report under the default `0.01 SOL` max and still
requires wallet approval. The third request is a subscription upgrade over the
max and is blocked before wallet signing. Say: "This one is blocked because it
exceeds my limit."

## Scene 3: Safe Request

Open the pending paid report, show the requested `0.001 SOL` spend, approve it
through the wallet, then move to `Activity` and open the devnet SkillGuard
receipt transaction. The mobile approval transaction includes the SOL transfer
and the SkillGuard `record_decision` receipt.

## Scene 4: Revoke Agent

Revoke Research Agent in mobile, then run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
SKILLGUARD_AGENT_PRIVATE_KEY_B58=<agent-secret-key-from-password-manager> \
  npm --prefix apps/research-agent run agent:loop
```

Open `Agents`, revoke Research Agent, then show in `Inbox` that the future
request is blocked because the policy is inactive/revoked. If the loop is
already running when you revoke, wait for the next cycle; it exits cleanly after
`policy_revoked`.

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
source of truth. Auto-approval is intentionally narrow: low-risk zero-spend
manifest-only requests can pass under policy, while any spend, higher-risk
request, or raw transaction still requires explicit wallet approval.
