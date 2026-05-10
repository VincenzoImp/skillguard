# SkillGuard Visual Components And Technical Proof

This file gives the video agent the visual system, concrete phone screens, proof
boundaries, and final QA rules. The screenshots in this bundle are the visual
source of truth.

## Screenshots To Use

Use these included files by exact filename:

- `site-home-desktop.png`: actual public site home screenshot, desktop layout.
- `site-demo-desktop.png`: actual public demo page screenshot, desktop layout.
- `site-home-mobile.png`: actual public site home screenshot, mobile layout.

If internet access exists, the live pages are:

- `https://skillguard-sol.vercel.app/`
- `https://skillguard-sol.vercel.app/demo`

The video should look as if the site's phone demo and compact card system were
recomposed into a motion story. Do not invent a new brand system.

## Brand Feel

SkillGuard should feel like a wallet-grade control surface:

- serious but not fear-based
- compact, not decorative
- technical, but readable for judges
- mobile-native
- security-focused without generic cybersecurity visuals

Avoid oversized marketing cards, stock visuals, decorative blobs, fake 3D
crypto imagery, or a generic AI agent landing page.

## Core Colors

Use these exact values:

| Role | Hex | Usage |
|---|---|---|
| Background | `#030712` | full-page base |
| Deep surface | `#070D18` | darker panels |
| Card surface | `#0B1220` | cards and phone body |
| Active surface | `#111827` | selected panels |
| Border | `#1F2937` | subtle dividers |
| Primary text | `#F8FAFC` | headings |
| Secondary text | `#A7B0C0` | body copy |
| Muted text | `#6B7280` | metadata |
| Mint / allow | `#00F0A8` | approved, pass, primary |
| Green / success | `#00C781` | confirmations |
| Blue / proof | `#58A6FF` | devnet, API, info |
| Violet / revoke | `#7B3FF7` | permissions, revocation |
| Amber / ask | `#F5B84B` | needs review |
| Red / block | `#FF5A68` | blocked, danger |

Primary gradient:

```css
linear-gradient(135deg, #00F0A8 0%, #58A6FF 48%, #7B3FF7 100%)
```

Use gradients sparingly. This should read as product UI, not a generic landing
page.

Typography:

```css
font-family: Inter, ui-sans-serif, system-ui, sans-serif;
```

Display moments:

```css
font-family: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
```

Mono only for hashes, addresses, signatures, or program IDs:

```css
font-family: "JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, monospace;
```

Do not use negative letter spacing. Keep text short enough to fit inside phone
cards and pills.

## Actual Site Layout To Reference

Home page structure:

1. Sticky dark header.
2. Hero section with copy on the left and a tall phone demo on the right.
3. Problem section with three cards.
4. Solution section with compact step cards.

Hero copy:

```text
Status pill: Wallet firewall for onchain AI agents
Headline: Give AI agents wallet access without giving up control.
Subhead: SkillGuard is a transaction firewall for onchain AI agents. Pair an agent, define exactly what it can do, auto-allow low-risk work, require consent for spending, block out-of-policy requests, and revoke access anytime.
```

Proof points:

```text
Allow -> Low-risk automation
Ask -> Spending approval
Block -> Out-of-policy requests
Revoke -> Agent access instantly
```

## Phone Frame Reference

Use a tall phone-shaped frame, not a desktop mock.

Target:

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
Left: SkillGuard icon and app name
Right: status pill such as Needs approval, Guarded, Connected
No changing subtitle under the app name.
```

Bottom tabs:

```text
Home
Inbox
Agents
Pair
Activity
```

## Phone Screens To Recreate

### Home

```text
Badges: devnet, live api
Primary message: Your wallet is guarded. / 1 agent request needs review.
Metrics: Pending, Agents, Blocked, History
Wallet: 13hF...op4Q
Actions: Review, Pair
```

### Pair

```text
Screen title: Pair agent
Copy: Scan a trusted agent QR. Importing creates a wallet-scoped permission, not a private-key handoff.
Button: Scan pairing QR
Loaded agent: Research Agent
Button: Sign & import agent
```

### Inbox

Use this for the paid approval beat:

```text
Screen title: Agent requests
Action title: Generate wallet risk report
Spend: 0.001 SOL
Copy: Research Agent requests 0.001 SOL for a wallet-risk report. SkillGuard asks before any signature.
Policy checks:
- Network allowed: solana-devnet
- Spend under per-action cap
- SOL movement requires wallet approval
Buttons: Reject, Approve
```

### Agents

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

When showing auto-approval, make `Allow under limits` selected. When showing
paid approval, show that spending still routes to mobile approval.

### Activity

Use these states:

```text
Auto-approved zero-spend:
Scan wallet for risky token approvals
Auto-approved by policy
No wallet signature needed

Wallet-approved spend:
Weekly wallet risk report
Approved
Wallet-approved execution. Receipt and signed transaction are visible on Solana Explorer.

Blocked overspend:
Subscribe to real-time risk alerts
Blocked before signing
Exceeds 0.01 SOL max

Revoked:
Research Agent revoked
Future requests are denied
```

## Core Visual Components

### Agent Node

Compact rounded panel with agent icon/dot, agent name, and status.

Labels:

- `Research Agent`
- `Signed manifest`
- `Waiting for policy`

### Wallet Node

Compact wallet panel with devnet badge, balance hint, and protected state.

Labels:

- `Owner wallet`
- `Devnet`
- `Funds stay protected`

### SkillGuard Firewall

Central block between agent and wallet. It splits requests into four lanes:

- `Allow`: mint, line passes through.
- `Ask`: amber, line routes to phone.
- `Block`: red, line stops at firewall.
- `Revoke`: violet, future lines disabled.

### Policy Card

Use a per-agent policy, not a generic settings dashboard.

Fields:

- `Agent: Research Agent`
- `Mode: Allow under limits / Ask every time`
- `Max per action: 0.01 SOL`
- `Daily cap: 0.05 SOL`
- `Network: Solana devnet`
- `Protocols: Helius, Birdeye`

Important copy:

```text
Auto-approval only applies to low-risk zero-spend requests.
Spending still needs wallet approval.
```

### Action Cards

Use these canonical cards:

1. `Scan wallet for risky token approvals`
   - `0 SOL`
   - `Low risk`
   - `Auto-approved by policy`
   - `No wallet signature needed`

2. `Generate weekly wallet risk PDF`
   - `0.001 SOL`
   - `Requires approval`
   - `Wallet signs after owner approval`

3. `Subscribe to real-time risk alerts`
   - `0.05 SOL`
   - `Blocked`
   - `Exceeds 0.01 SOL max`

### Technical Proof Grid

Use short proof cards:

- `Android APK`
- `Mobile Wallet Adapter`
- `Vercel API`
- `Research Agent`
- `Anchor receipt program`
- `Solana devnet`

Do not show long logs or endpoint lists. Use code only as a brief proof insert
if there is time.

## Micro-Copy Rules

Use short, high-signal text:

- `Useful agents need wallet access`
- `Direct signer access puts funds at risk`
- `Wallet firewall for AI agents`
- `Allow / Ask / Block / Revoke`
- `Low-risk work can auto-approve`
- `Spending requires consent`
- `Blocked before signing`
- `Recorded on Solana devnet`
- `Agents can act. Users stay in control.`

Do not render the complete voiceover as subtitles.

## Motion Rules

- Request lines move from agent to SkillGuard.
- Allowed request passes through in mint.
- Ask request routes to the phone in amber.
- Blocked request stops at the firewall in red.
- Revoke disables future request lines in violet.
- Receipt proof appears only after wallet approval.
- Keep motion restrained, precise, and readable.

## Technical Proof

These parts exist in the real project:

- Android app: `apps/mobile`
- Hosted site/API: `https://skillguard-sol.vercel.app`
- Agent worker: `apps/research-agent`
- SDK package: `packages/sdk`
- Protocol package: `packages/protocol`
- Anchor program: `programs/skillguard`
- Canonical APK: `build/mobile/skillguard.apk`

Real flow:

1. Research Agent submits an ActionManifest.
2. API evaluates the wallet-owned policy.
3. Low-risk zero-spend manifests can pass policy without wallet signing.
4. Mobile app loads pending spending requests through a signed wallet session.
5. Mobile Wallet Adapter signs approvals when the owner approves.
6. Anchor program records wallet-approved decision receipts on Solana devnet.

Honest boundary:

SkillGuard protects requests that go through SkillGuard. It does not claim to
protect arbitrary transactions signed outside the system, and it does not hold
custody of user funds. It also does not auto-sign spending transactions in the
MVP. Auto-approval is limited to low-risk zero-spend requests.

## HTML Presentation Requirements

- Build a screen-recordable 1920 x 1080 animated HTML presentation or small
  Vite app.
- Do not generate audio.
- Do not generate subtitles for the full script.
- Use short micro-copy only.
- Keep runtime under 3 minutes.
- Use real app clips only as small picture-in-picture proof inserts.
- If app clips are unavailable, recreate the screens accurately in the phone
  frame.
- Make every screen readable at 1080p.

## Final QA Checklist

Before returning the final video presentation, check:

- The first 10 seconds make the wallet-risk problem clear.
- The story explains why existing options are bad.
- SkillGuard is framed as a wallet firewall, not as another agent.
- The video shows pair, auto-allow zero-spend, approve spend, block overspend,
  and revoke.
- Spending never appears auto-signed.
- The phone mock matches the included screenshots.
- The colors and cards match the real site.
- The technical proof is present but concise.
- There is no audio and no full-script subtitle layer.
- Runtime is under 3 minutes.
