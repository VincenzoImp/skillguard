# Style And Component Reference

Use this file when recreating SkillGuard screens or building the animated HTML
demo. The goal is visual consistency with the public site and Android app, not a
new campaign style.

## Visual Source

- Public site implementation: `apps/site/src/App.tsx`
- Public site styles: `apps/site/src/styles.css`
- Brand rules: `docs/DESIGN_SYSTEM.md`
- Mobile screen implementations: `apps/mobile/src/screens/`
- Product icon: `assets/brand/icon.png`

## Brand Feel

SkillGuard should feel like a wallet-grade control surface:

- serious but not fear-based
- compact, not decorative
- technical, but readable for judges
- mobile-native
- security-focused without generic cybersecurity visuals

Do not use oversized marketing cards, stock visuals, decorative blobs, or a
generic crypto gradient hero.

## Core Colors

Use these exact color values in HTML recreations:

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

Primary brand gradient:

```css
linear-gradient(135deg, #00F0A8 0%, #58A6FF 48%, #7B3FF7 100%)
```

Use gradients sparingly. The app and demo should read as a product UI, not a
generic landing page.

## Typography

Recommended CSS:

```css
font-family: Inter, ui-sans-serif, system-ui, sans-serif;
```

Display moments may use:

```css
font-family: "Space Grotesk", Inter, ui-sans-serif, system-ui, sans-serif;
```

Use mono only for hashes, addresses, short signatures, or program IDs:

```css
font-family: "JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, monospace;
```

Do not use negative letter spacing. Keep text short enough to fit inside mobile
cards and pills.

## Component Library For The Video

### Agent Node

Visual: compact rounded panel with small agent icon/dot, agent name, and a short
status.

Suggested labels:

- `Research Agent`
- `Signed manifest`
- `Waiting for policy`

### Wallet Node

Visual: compact wallet panel with devnet badge, balance hint, and lock/check
state.

Suggested labels:

- `Owner wallet`
- `Devnet`
- `Funds stay protected`

### SkillGuard Firewall

Visual: vertical shield/firewall block between agent and wallet. Use
`assets/brand/icon.png` inside or above it. This is the central product metaphor.

State lanes:

- `Allow`: mint, line passes through
- `Ask`: amber, line routes to phone
- `Block`: red, line stops at firewall
- `Revoke`: violet, future lines disabled

### Policy Card

Show a compact per-agent policy, not a generic settings dashboard.

Use these fields:

- `Agent: Research Agent`
- `Mode: Allow under limits / Ask every time`
- `Max per action: 0.01 SOL`
- `Daily cap: 0.05 SOL`
- `Network: Solana devnet`
- `Protocols: Helius, Birdeye`

Important copy for `Allow under limits`:

```text
Auto-approval only applies to low-risk zero-spend requests.
Spending still needs wallet approval.
```

### Phone Frame

Use a tall phone-shaped frame, not a generic desktop mock. Target aspect ratio:
`9 / 19.5`. Keep the phone large enough that labels are readable at 1080p.

Expected tabs:

- `Home`: wallet connected, devnet, live API
- `Pair`: QR import flow
- `Inbox`: pending approval requests
- `Agents`: connected agents and per-agent policy
- `Activity`: approved, blocked, revoked, receipt outcomes

Do not show a huge fake phone that does not match the app. If recreating screens
instead of inserting real recordings, keep the mobile UI close to the real app:
dark cards, compact metadata, status chips, and bottom-tab navigation.

### Action Cards

Use three canonical action cards:

1. `Scan wallet for risky token approvals`
   - `0 SOL`
   - `Low risk`
   - `Auto-approved by policy`
   - Fine print: `No wallet signature needed`

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

Use short, high-signal text on screen:

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
- Receipt proof appears only after the wallet approval.

Keep motion restrained. The product should feel precise and trustworthy.
