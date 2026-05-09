# Demo Script

Target length: under 3 minutes.

## Full Local Script

```bash
. scripts/dev-env.sh
scripts/dev-demo.sh
```

`scripts/dev-demo.sh` starts the local API and site, then waits. It does not
submit fake wallet actions. Connect a wallet in the Android app first, copy the
full wallet address, then submit agent requests with that exact address.

## Manual Commands

```bash
npm --prefix apps/api run dev

EXPO_PUBLIC_SKILLGUARD_API_URL=http://10.0.2.2:8787 \
  npm --prefix apps/mobile run android

export SKILLGUARD_API_URL=http://localhost:8787
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm --prefix apps/demo-agent run submit:unsafe
npm --prefix apps/demo-agent run submit:safe
npm --prefix apps/demo-agent run submit:revoked
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

Open SkillGuard mobile and connect a devnet wallet through Mobile Wallet Adapter.
Show the wallet address, devnet badge, live API badge, connected Research Agent,
and policy mode.

## Scene 2: Unsafe Request

Run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
  npm --prefix apps/demo-agent run submit:unsafe
```

Refresh the mobile inbox. Show the unsafe request and the `spend_exceeds_max`
policy reason. The wallet is not asked to sign blocked actions.
Say: "This one is blocked because it exceeds my limit."

## Scene 3: Safe Request

Run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
  npm --prefix apps/demo-agent run submit:safe
```

Refresh mobile, open the safe request, show zero spend, approve it through the
wallet, and open the devnet SkillGuard receipt transaction.

## Scene 4: Revoke Agent

Revoke Research Agent in mobile, then run:

```bash
SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address> \
  npm --prefix apps/demo-agent run submit:revoked
```

Show that the future request is blocked because the policy is inactive/revoked.

## Scene 5: Developer Integration

Show the README SDK snippet.

```text
Any Solana agent can integrate SkillGuard without receiving the user's private key.
```
