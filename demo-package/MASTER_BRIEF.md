# SkillGuard Video Master Brief

Start here. This file is the complete context for an external video or
presentation agent that knows nothing about SkillGuard. The other files in this
folder provide the script, shot list, capture guide, style rules, and prompts.

## Product In One Line

SkillGuard is the wallet firewall for AI agents operating onchain.

## The Core Problem

AI agents become valuable when they can act: scan wallets, monitor risk, pay for
reports, claim rewards, route swaps, rebalance positions, or prepare execution.
Onchain action eventually needs wallet authority.

Without SkillGuard, the user has three bad choices:

1. Give the agent a personal wallet or signer and risk everything in it.
2. Fund a separate agent wallet and still risk that funded balance.
3. Manually approve every action and remove the agent's autonomy.

SkillGuard is the missing fourth path: the agent can request wallet actions, but
every request passes through wallet-owned policy before signing.

## The Product Model

SkillGuard does not give an agent the user's private key. It creates a mediated
control loop:

1. The wallet owner pairs an agent.
2. The owner sets per-agent policy.
3. The agent submits a signed action manifest.
4. SkillGuard evaluates the request.
5. The request is allowed, sent to mobile approval, blocked, or denied after
   revocation.
6. Wallet-approved spending decisions are recorded as Solana devnet receipts.

The four product verbs are:

- `Allow`: low-risk zero-spend requests can pass under policy.
- `Ask`: spending, higher-risk, or raw transaction requests require explicit
  mobile wallet approval.
- `Block`: overspend, wrong network, unauthorized protocol, or expired requests
  are denied before signing.
- `Revoke`: the owner can cut off an agent identity at any time.

## Important Honesty Boundary

Do not claim that SkillGuard automatically signs spending transactions with the
user's wallet.

In this MVP, auto-approval is intentionally narrow:

- Low-risk zero-spend requests can be auto-approved when the agent is set to
  `Allow under limits`.
- No wallet signature or SOL movement is needed for that auto-approved path.
- Any request that spends SOL, references a raw transaction, or has higher risk
  still requires explicit wallet approval through Mobile Wallet Adapter.

The strongest video line is:

> Low-risk work can proceed automatically. The moment money moves, the owner is
> back in the loop.

## Demo Story

The final video must be under 3 minutes. The story should be understandable even
with the audio muted.

Recommended spine:

```text
0:00-0:12  Hook: useful agents need wallet access, and wallet access means fund risk.
0:12-0:32  Bad choices: personal wallet, funded burner, approve everything manually.
0:32-0:52  Missing layer: SkillGuard sits between agent intent and wallet signatures.
0:52-1:15  Product model: Allow, Ask, Block, Revoke.
1:15-2:25  Proof: pair Research Agent, auto-allow zero-spend scan, approve 0.001 SOL, block 0.05 SOL, revoke.
2:25-2:45  Technical proof: Android, Mobile Wallet Adapter, Vercel API, Research Agent, Anchor, devnet receipt.
2:45-2:55  Close: Agents can act. Users stay in control.
```

## Demo Agent And Actions

The demo uses `Research Agent`. It is a real worker in `apps/research-agent`.
It submits three requests:

1. `Scan wallet for risky token approvals`
   - Spend: `0 SOL`
   - Risk: low
   - Demo meaning: can auto-approve if the user changed this agent to
     `Allow under limits`.
   - Boundary: this is not a wallet-signed payment transaction.

2. `Generate weekly wallet risk PDF`
   - Spend: `0.001 SOL`
   - Risk: low, but money moves
   - Demo meaning: mobile approval is required; the wallet signs only after the
     owner approves.

3. `Subscribe to real-time risk alerts`
   - Spend: `0.05 SOL`
   - Risk: high / over policy
   - Demo meaning: blocked before wallet signing because the policy max is
     `0.01 SOL` per action.

After that, revoke the agent and show that future requests are denied because
the connection is inactive.

## What The Viewer Must Understand

By the end, a judge should understand:

- SkillGuard is not another agent. It is the control layer for agents.
- The agent never receives the user's private key.
- Each agent has its own policy.
- Some safe work can proceed automatically.
- Spending still requires owner approval.
- Overspend is blocked before wallet signing.
- Revocation cuts off the agent identity.
- The demo is real: Android app, hosted API, agent worker, and Solana devnet
  receipts.

## What Not To Say

Avoid these claims:

- "SkillGuard signs transactions automatically for the user."
- "The agent controls the user's wallet."
- "This protects any arbitrary transaction outside SkillGuard."
- "This is mainnet custody."
- "This is only a demo UI."

Use these instead:

- "SkillGuard mediates agent requests before wallet signing."
- "Low-risk zero-spend work can auto-approve under policy."
- "Spending still requires explicit wallet approval."
- "The agent never receives the private key."
- "The paid approval path is tied to a signed manifest and devnet receipt."

## Visual Direction

Use the existing SkillGuard visual language:

- dark wallet-grade background
- compact cards
- mint for approved/allowed
- amber for requires review
- red for blocked/rejected
- violet for revoked/permissions
- blue for network/proof
- phone-shaped app inserts
- short micro-copy, never full subtitles

Read `references/style-and-components.md` and
`references/site-home-reference.md` before building visuals. The package also
includes screenshots in `assets/site-home-desktop.png`,
`assets/site-demo-desktop.png`, and `assets/site-home-mobile.png`; use them as
the concrete component/style reference.

## Required Files To Read Next

1. `08-director-prompt.md`
2. `01-voiceover-script.md`
3. `02-shot-list.md`
4. `03-visual-storyboard.md`
5. `04-app-recording-guide.md`
6. `05-html-presentation-spec.md`
7. `06-assets-map.md`
8. `references/style-and-components.md`
9. `references/site-home-reference.md`
10. `references/technical-proof.md`
