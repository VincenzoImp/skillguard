# Design System

Status: initial design system based on the current SkillGuard brand assets.

## Visual Source Of Truth

`apps/site` is the canonical visual prototype for the project.

It is not just an internal demo. It should evolve into the public project site and remain the reference for:

- the mobile app visual language
- demo screenshots and video framing
- README hero images
- pitch deck visuals
- component styling and motion tone

Implementation rule:

- `docs/DESIGN_SYSTEM.md` defines the tokens and UI rules.
- `apps/site` shows those rules in a working product-facing experience.
- `apps/mobile` should adapt the same style to native/mobile constraints instead of inventing a separate look.

The mobile app does not need to copy every web layout, but it must preserve:

- dark wallet-grade surface
- mint/violet/blue status language
- compact cards
- clear action detail hierarchy
- approval/rejection/revocation states
- receipt timeline treatment
- calm, precise copy

## Brand Position

SkillGuard should feel like a wallet-grade control surface for AI agents:

- trustworthy, not scary
- mobile-native, not enterprise-heavy
- technical enough for Solana builders
- clear enough for hackathon judges
- security-focused without looking like generic cybersecurity

Core product line:

```text
The firewall between AI agents and your Solana wallet.
```

## Asset Analysis

### `assets/brand/icon.png`

This is the standalone app mark.

Use it for:

- app icon
- favicon
- splash screen
- mobile header icon
- social avatar
- receipt empty state

What it communicates:

- shield: wallet protection
- checkmark: explicit approval
- Solana-style bands: Solana ecosystem context
- dark background: premium crypto/security feel

Guidelines:

- keep generous padding around it
- avoid extra glows in UI
- do not place it on busy backgrounds
- use it as the primary product icon

### `assets/brand/wordmark.png`

This is the horizontal lockup.

Use it for:

- README hero
- landing page hero
- public project site header
- demo video intro
- pitch deck cover
- social banner

What it communicates:

- circular signal/check mark: agent activity and live monitoring
- `SkillGuard` wordmark: strong product recognition
- phone/check icon: mobile approval
- tagline: explains the product quickly

Note:

- The current tagline says "Mobile approval layer for AI agent actions on Solana".
- The revised product is broader: "Permission layer for Solana agents".
- Keep the current asset for now, but future logo exports should update the tagline.

## Logo Usage

Primary mark:

- `icon.png`

Primary wordmark:

- `wordmark.png`

Rule:

- Use the shield icon for app/product identity.
- Use the circular signal/check mark only when using the full wordmark asset.
- Do not place the shield icon and circular wordmark icon side by side in small UI.

## Color Tokens

### Core

| Token | Hex | Use |
|---|---|---|
| `bg.950` | `#030712` | app background |
| `bg.900` | `#070D18` | deep surface |
| `surface.850` | `#0B1220` | cards and panels |
| `surface.800` | `#111827` | active panels |
| `border.subtle` | `#1F2937` | subtle borders |
| `text.primary` | `#F8FAFC` | primary text |
| `text.secondary` | `#A7B0C0` | secondary text |
| `text.muted` | `#6B7280` | metadata |

### Brand

| Token | Hex | Use |
|---|---|---|
| `brand.mint` | `#00F0A8` | primary brand, approval |
| `brand.green` | `#00C781` | success |
| `brand.violet` | `#7B3FF7` | Solana accent |
| `brand.blue` | `#58A6FF` | info and route preview |
| `brand.white` | `#F8FAFC` | strong foreground |

### Status

| Token | Hex | Use |
|---|---|---|
| `status.safe` | `#00F0A8` | safe, approved, pass |
| `status.warning` | `#F5B84B` | needs review |
| `status.danger` | `#FF5A68` | blocked, rejected |
| `status.info` | `#58A6FF` | informational |
| `status.revoked` | `#8B5CF6` | revoked agent |

## Gradients

Use gradients sparingly. Keep the product UI mostly dark, crisp, and readable.

Primary brand gradient:

```css
linear-gradient(135deg, #00F0A8 0%, #58A6FF 48%, #7B3FF7 100%)
```

Approval gradient:

```css
linear-gradient(135deg, #00F0A8 0%, #00C781 100%)
```

Danger gradient:

```css
linear-gradient(135deg, #FF5A68 0%, #F5B84B 100%)
```

Avoid large purple-blue gradient backgrounds in core app screens. The UI should read as a serious wallet control surface, not a generic crypto landing page.

## Typography

Recommended stack:

```css
font-family: Inter, Space Grotesk, system-ui, sans-serif;
```

Usage:

- `Space Grotesk` for brand/display moments
- `Inter` or system sans for app UI
- `JetBrains Mono` or `Geist Mono` for hashes, signatures, program IDs

Scale:

| Role | Size | Weight |
|---|---:|---:|
| App title | 28 | 700 |
| Screen title | 22 | 700 |
| Section title | 16 | 650 |
| Body | 15 | 400 |
| Metadata | 12 | 500 |
| Hash/signature | 12 | 500 mono |
| Button | 15 | 650 |

## Layout Rules

- Mobile first.
- Dark mode first.
- Compact, calm information density.
- No nested cards.
- Cards should use 8px radius.
- Bottom sheets for approval decisions.
- Clear network badges on every action.
- Always show wallet impact before approval.

Spacing:

| Token | Value |
|---|---:|
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |

Radius:

| Token | Value | Use |
|---|---:|---|
| `radius.sm` | 6 | badges, chips |
| `radius.md` | 8 | cards, buttons, inputs |
| `radius.lg` | 12 | bottom sheets |
| `radius.full` | 999 | pills, avatars |

## Core Components

### Agent Card

Shows one connected agent.

Content:

- agent name
- agent status
- permission mode
- last action
- quick settings button

States:

- active: mint accent
- ask every time: blue accent
- allow under limits: mint accent
- blocked: danger accent
- revoked: violet muted accent

### Permission Editor

Lets users define what an agent can request.

Controls:

- segmented control: `Ask every time`, `Allow under limits`, `Block`
- max spend per action
- daily cap
- allowed protocols
- allowed mints
- allowed network
- expiry
- revoke button

Rule:

- If `Allow under limits` is selected, show: "Token-moving actions still require wallet signing in this MVP."

### Action Request Card

Inbox preview for a pending action.

Content:

- agent name
- action summary
- spend estimate
- risk badge
- policy result
- time remaining

Statuses:

- `Needs approval`
- `Within policy`
- `Blocked by policy`
- `Expired`
- `Revoked agent`

### Action Detail

Decision screen.

Sections:

- what the agent wants
- wallet impact
- policy checks
- protocols touched
- manifest hash
- approve/reject controls

Buttons:

- approve: filled mint
- reject: danger outline
- edit permission: secondary

### Receipt Timeline

Shows proof of what happened.

Events:

- action proposed
- policy evaluated
- user approved/rejected
- receipt recorded on Solana
- execution signature attached, if available

Use monospace for:

- manifest hash
- receipt PDA
- transaction signature

### Network Badge

Variants:

- devnet: blue
- mainnet: amber if funds are involved
- local: muted

Network badges must be visible on action detail and receipt screens.

## Interaction Rules

Before approval, the user must see:

- agent name
- requested action
- max spend vs requested spend
- protocols touched
- network
- policy result

For revocation:

- revocation must be available from agent detail and permission editor
- after revocation, future requests from that agent are blocked
- revocation should be recorded on-chain in the full demo path

For auto-allow:

- MVP auto-allow only applies to safe/non-spending actions or receipt-only flows
- token-moving actions still require wallet signing unless a future delegation module is added

## Voice And Copy

Tone:

- precise
- calm
- protective
- no hype

Good copy:

- "Research Agent wants to use your wallet."
- "This request is within your policy."
- "Blocked because spend exceeds your limit."
- "Revoked agents cannot request new actions."
- "Token-moving actions still require wallet signing."

Avoid:

- absolute safety claims
- vague trustless-security claims
- "set and forget" for wallet spending
- unrestricted-autonomy language for wallet control

## MVP Screens

1. Wallet connect
2. Connected agents
3. Agent detail
4. Permission editor
5. Request inbox
6. Action detail
7. Receipt timeline

Nice-to-have:

- notification settings
- developer connect QR
- receipt verifier
- LI.FI route preview

## Demo Visual Direction

Show:

- dark mobile UI
- shield icon on splash/header
- connected Research Agent
- permission editor
- unsafe request blocked
- safe request approved
- receipt timeline
- revoked agent state

Use the wordmark in:

- README hero
- demo intro/outro
- presentation cover

Use the icon in:

- app icon
- splash
- mobile header
- favicon
