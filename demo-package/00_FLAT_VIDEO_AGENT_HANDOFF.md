# SkillGuard Flat Video Agent Handoff

Use this file when the demo materials are imported without folder structure.
Read this file first. It contains the complete brief, style reference, component
reference, timing, and honesty boundaries without relying on nested paths.

## Files You Should See By Name

If the import flattened every folder, look for these filenames:

- `MASTER_BRIEF.md` - deeper product context.
- `08-director-prompt.md` - short creative director prompt.
- `01-voiceover-script.md` - timing and narration. Do not render it as subtitles.
- `02-shot-list.md` - scene-by-scene visual plan.
- `03-visual-storyboard.md` - visual storyboard.
- `04-app-recording-guide.md` - how real app clips should be used.
- `05-html-presentation-spec.md` - HTML/video build spec.
- `style-and-components.md` - design tokens and component rules.
- `site-home-reference.md` - concrete site and phone component reference.
- `technical-proof.md` - proof that the project is real.
- `site-home-desktop.png` - actual public site home screenshot, 1440 x 1100.
- `site-demo-desktop.png` - actual public demo page screenshot, 1440 x 1100.
- `site-home-mobile.png` - actual public site mobile screenshot, 390 x 844.
- `icon.png` if available - SkillGuard shield logo. If unavailable, use the
  icon embedded in the screenshots as the visual reference.

Do not fail if some optional files are absent. This file is enough to create the
video, and the screenshots are the concrete visual source of truth.

## Assignment

Create a polished animated HTML presentation/video for SkillGuard that can be
screen-recorded at 1920 x 1080.

Hard constraints:

- Do not generate audio.
- Do not render the full voiceover as subtitles.
- The voiceover will be recorded separately and synced later.
- Use only short micro-copy on screen.
- Keep final runtime under 3 minutes.
- Use the visual style from `site-home-desktop.png`,
  `site-demo-desktop.png`, `site-home-mobile.png`, and the component notes
  below.
- Use app recordings only as short picture-in-picture proof inserts. If real
  app clips are unavailable, recreate accurate phone-frame screens.

## Product In One Line

SkillGuard is the wallet firewall for AI agents operating onchain.

## Problem

AI agents become useful onchain when they can act: scan wallets, monitor risk,
pay for reports, claim rewards, route swaps, rebalance positions, or prepare
execution. But onchain action eventually needs wallet authority.

Without SkillGuard, the user has three bad choices:

1. Give the agent a personal wallet or signer and risk everything in it.
2. Fund a separate agent wallet and still risk that balance.
3. Manually approve every action and remove the agent's autonomy.

SkillGuard is the missing fourth path: the agent can request wallet actions, but
every request passes through wallet-owned policy before signing.

## Core Model

- `Allow`: low-risk zero-spend requests can pass under owner policy.
- `Ask`: spending, higher-risk, or raw transaction requests require explicit
  mobile wallet approval.
- `Block`: overspend, wrong network, unauthorized protocol, or expired requests
  are denied before signing.
- `Revoke`: the wallet owner can cut off an agent identity at any time.

Critical boundary:

Do not say or imply that SkillGuard auto-signs spending transactions. In the
MVP, auto-approval only applies to low-risk zero-spend requests. Any request
that spends SOL, references a raw transaction, or has higher risk must go
through explicit mobile wallet approval.

Best line:

```text
Low-risk work can proceed automatically. The moment money moves, the owner is back in the loop.
```

## Three-Minute Timing

```text
0:00-0:12  Hook: useful agents need wallet access, and wallet access means fund risk.
0:12-0:32  Bad choices: personal wallet, funded burner, approve everything manually.
0:32-0:52  Missing layer: SkillGuard sits between agent intent and wallet signatures.
0:52-1:15  Product model: Allow, Ask, Block, Revoke.
1:15-2:25  Proof: pair Research Agent, auto-allow zero-spend scan, approve 0.001 SOL, block 0.05 SOL, revoke.
2:25-2:45  Technical proof: Android, Mobile Wallet Adapter, Vercel API, Research Agent, Anchor, devnet receipt.
2:45-2:55  Close: Agents can act. Users stay in control.
```

## Voiceover Script

Do not place this full text on screen.

### 0:00-0:12 Hook

AI agents are becoming useful onchain only when they can act: pay, route,
rebalance, claim, report, and execute. But the moment an agent needs wallet
access, real funds are at risk.

### 0:12-0:34 The Struggle

Today the choices are bad. Give the agent my personal wallet, and I risk
everything in it. Fund a separate wallet, and I still risk that balance. Approve
every transaction manually, and the agent is no longer autonomous.

### 0:34-0:52 Missing Layer

Wallets can sign. Agent frameworks can generate actions. What is missing is the
control layer between them: a way to give agents wallet access without giving up
control.

### 0:52-1:15 Solution

SkillGuard is that layer: a wallet firewall for AI agents. Agents submit signed
action manifests. SkillGuard checks wallet-owned policy and decides whether to
Allow, Ask, Block, and Revoke before anything reaches signing.

### 1:15-1:34 How It Works

The owner pairs an agent, sets limits, and decides what can proceed
automatically, what needs explicit consent, and what must be denied. The agent
never receives the private key. It waits for a wallet-owned decision.

### 1:34-2:25 Real Demo

Here is the live demo path. I connect my devnet wallet, scan a QR, and import
Research Agent. The QR only imports the agent identity and policy template. I
still review the limits and sign the connection.

First, I switch this agent to allow low-risk work under limits. It submits a
zero-spend wallet scan, and SkillGuard approves it automatically because no
funds move and no wallet signature is needed.

Then the same agent asks for a paid report that spends `0.001 SOL`. Because
money moves, SkillGuard routes the request to the mobile inbox. I review the
manifest, approve it, and only then does my wallet sign.

Next, the same agent asks for a larger `0.05 SOL` upgrade. This exceeds my
per-action limit, so SkillGuard blocks it before any wallet signature prompt.
Finally, I revoke the agent, and future requests from that identity are denied.

### 2:25-2:45 Proof

This is not a mockup. The Android app uses Mobile Wallet Adapter. The hosted API
runs on Vercel. The research agent is a real worker. Wallet-approved spending
decisions are recorded as Solana devnet receipts tied to the action manifest.

### 2:45-2:55 Close

SkillGuard gives AI agents wallet access without giving up control. Agents can
act. Users stay in control.

## Visual Style

Match the actual site screenshots:

- dark wallet-grade background
- compact cards
- strong phone-shaped mock
- mint for approved/allowed
- amber for needs approval
- red for blocked/rejected
- violet for revoked/permissions
- blue for devnet/proof/API
- no stock visuals
- no decorative blobs/orbs
- no generic SaaS landing page

Core colors:

| Role | Hex |
|---|---|
| Background | `#030712` |
| Deep surface | `#070D18` |
| Card surface | `#0B1220` |
| Active surface | `#111827` |
| Border | `#1F2937` |
| Primary text | `#F8FAFC` |
| Secondary text | `#A7B0C0` |
| Muted text | `#6B7280` |
| Mint / allow | `#00F0A8` |
| Green / success | `#00C781` |
| Blue / proof | `#58A6FF` |
| Violet / revoke | `#7B3FF7` |
| Amber / ask | `#F5B84B` |
| Red / block | `#FF5A68` |

Primary gradient:

```css
linear-gradient(135deg, #00F0A8 0%, #58A6FF 48%, #7B3FF7 100%)
```

Typography:

```css
font-family: Inter, ui-sans-serif, system-ui, sans-serif;
```

Display:

```css
font-family: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
```

## Actual Site Components To Recreate

Use `site-home-desktop.png` as the main layout reference.

Home page structure:

1. Sticky dark header.
2. Hero with copy on the left and tall phone demo on the right.
3. Problem section with three cards.
4. Solution section with five compact step cards.

Hero copy:

```text
Status pill: Wallet firewall for onchain AI agents
Headline: Give AI agents wallet access without giving up control.
Subhead: SkillGuard is a transaction firewall for onchain AI agents. Pair an agent, define exactly what it can do, auto-allow low-risk work, require consent for spending, block out-of-policy requests, and revoke access anytime.
```

Hero proof cards:

```text
Allow -> Low-risk automation
Ask -> Spending approval
Block -> Out-of-policy requests
Revoke -> Agent access instantly
```

## Phone Frame Reference

The phone frame must be tall and close to the actual site/app. Do not create a
generic desktop mock.

Target visual:

```text
Outer max width: about 356px
Outer radius: about 40px
Outer shell: black
Inner app radius: about 32px
Inner app height: about 690px
Inner background: #070D18
Header top padding: enough for mobile status area
Bottom tabs: Home, Inbox, Agents, Pair, Activity
```

Phone header:

```text
SkillGuard
Status pill: Needs approval / Approved / Blocked
```

## Phone Screens To Show

### Pair

```text
Pair agent
Scan a trusted agent QR. Importing creates a wallet-scoped permission, not a private-key handoff.
Scan pairing QR
Loaded agent: Research Agent
Button: Sign & import agent
```

### Agents / Policy

```text
Connected agents
Research Agent
Wallet risk checks through SkillGuard.
Status: Active
Network: solana-devnet
Policy for this agent
Auto-approval applies only to low-risk zero-spend requests.
Modes: Ask every time / Allow under limits / Block
Max spend: 0.01 SOL
Daily cap: 0.05 SOL
Protocols: Helius, Birdeye
Button: Revoke agent
```

For the auto-approval beat, visually select `Allow under limits`.

### Auto-Approved Action

```text
Scan wallet for risky token approvals
0 SOL
Low risk
Auto-approved by policy
No wallet signature needed
```

### Paid Approval Inbox

```text
Agent requests
Generate wallet risk report
Research Agent requests 0.001 SOL for a wallet-risk report. SkillGuard asks before any signature.
Network: devnet
Spend: 0.001 SOL
Risk: medium
Policy says ask
- Network allowed: solana-devnet
- Spend under per-action cap
- SOL movement requires wallet approval
Buttons: Reject, Approve
```

### Blocked Overspend

```text
Subscribe to real-time risk alerts
0.05 SOL
Blocked
Exceeds 0.01 SOL max
Blocked before signing
```

### Activity

```text
Receipts
Decision history
Weekly wallet risk report
Approved
Wallet-approved execution. Receipt and signed transaction are visible on Solana Explorer.
```

## Required Motion

- Request lines move from Research Agent to SkillGuard.
- Allowed zero-spend request passes in mint.
- Spending request routes to phone approval in amber.
- Blocked request stops at firewall in red.
- Revoke disables future request lines in violet.
- Receipt proof appears only after wallet approval.

## On-Screen Micro-Copy

Use only short lines:

```text
Useful agents need wallet access
Direct signer access puts funds at risk
Wallet firewall for AI agents
Allow / Ask / Block / Revoke
Low-risk work can auto-approve
Spending requires consent
Blocked before signing
Recorded on Solana devnet
Agents can act. Users stay in control.
```

## Technical Proof Grid

Show these as compact proof cards:

```text
Android APK
Mobile Wallet Adapter
Vercel API
Research Agent
Anchor receipt program
Solana devnet
```

## Deliverable

Produce a screen-recordable animated HTML presentation or small Vite app.
No audio. No full subtitles. Final runtime under 3 minutes.
