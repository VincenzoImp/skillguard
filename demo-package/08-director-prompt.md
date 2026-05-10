# Director Prompt

Use this as the primary prompt for the agent that will create the final
three-minute SkillGuard demo video. The agent should still read the other files
in this folder, but this is the creative north star.

## Core Brief

Create a polished under-three-minute hackathon video for SkillGuard.

SkillGuard gives AI agents wallet access without giving up control. It is a
wallet firewall for onchain AI agents: agents can request actions, but the wallet
owner decides what is allowed automatically, what requires consent, what is
blocked before signing, and what can be revoked.

## The Three-Minute Spine

1. Problem: useful agents need wallet access, and wallet access means fund risk.
2. Bad tradeoff: personal wallet, funded burner wallet, or manual approval.
3. Solution: SkillGuard sits between agent intent and wallet signatures.
4. Proof: show pair, approve, block, revoke in the Android app.
5. Credibility: show Android app, Mobile Wallet Adapter, Vercel API, Research Agent, Anchor, Solana devnet receipt.
6. Close: agents can act; users stay in control.

## First 10 Seconds

The first 10 seconds must make the problem obvious before any architecture:

- AI agent wants to act onchain.
- Wallet contains real funds.
- Direct signer access is dangerous.

Do not start with code, API diagrams, Solana explanations, or a generic product
hero.

## What To Show

Prioritize these app/proof moments:

1. Pair Research Agent by QR.
2. Approve the `0.001 SOL` wallet-risk report.
3. Block the `0.05 SOL` overspend before signing.
4. Revoke the agent.
5. Show or reference the Solana devnet receipt.

Use app recordings as proof inserts inside the animated presentation. Do not
make the whole video a raw phone walkthrough.

## What Not To Waste Time On

Do not waste time on:

- long code snippets
- full endpoint lists
- every settings field
- generic AI hype
- generic Solana education
- decorative animation that does not clarify the firewall model
- full voiceover subtitles on screen

## On-Screen Copy

Use only short micro-copy:

- `Useful agents need wallet access`
- `Wallet access means fund risk`
- `Wallet firewall for AI agents`
- `Allow / Ask / Block / Revoke`
- `Spending requires consent`
- `Blocked before signing`
- `Recorded on Solana devnet`
- `Agents can act. Users stay in control.`

## Required Tone

Calm, credible, urgent, and technical enough for judges. The video should feel
like working infrastructure, not a speculative concept.
