# Demo Script

Target length: under 3 minutes.

## Full Local Script

```bash
. scripts/dev-env.sh
scripts/dev-demo.sh
```

## Manual Commands

```bash
cd apps/api && npm run dev
cd apps/demo-agent && npm run submit:unsafe
cd apps/demo-agent && npm run submit:safe
cd apps/demo-agent && npm run submit:revoked
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
Show the wallet address, devnet badge, connected Research Agent, and policy mode.

## Scene 2: Unsafe Request

Run:

```bash
cd apps/demo-agent && npm run submit:unsafe
```

Show the unsafe request in the inbox and the `spend_exceeds_max` policy reason.
Say: "This one is blocked because it exceeds my limit."

## Scene 3: Safe Request

Run:

```bash
cd apps/demo-agent && npm run submit:safe
```

Open the safe request in mobile, show zero spend, approve it through the wallet,
and open the devnet receipt signature.

## Scene 4: Revoke Agent

Revoke Research Agent in mobile, then run:

```bash
cd apps/demo-agent && npm run submit:revoked
```

Show that the future request is blocked because the policy is inactive/revoked.

## Scene 5: Developer Integration

Show the README SDK snippet.

```text
Any Solana agent can integrate SkillGuard without receiving the user's private key.
```
