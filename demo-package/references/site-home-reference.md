# Site Home Reference

This file makes the demo package self-contained for a video agent. The public
site is the best reference for SkillGuard's actual visual components. If the
agent does not have access to the full repository, use the screenshots and
component notes here instead of inventing a new style.

## Required Visual References

Use these screenshots as the concrete visual reference:

- `demo-package/assets/site-home-desktop.png` - desktop home hero with the real
  site layout and phone demo.
- `demo-package/assets/site-demo-desktop.png` - desktop demo page with the real
  demo card treatment.
- `demo-package/assets/site-home-mobile.png` - mobile-width home reference.

If internet access is available, also open:

- `https://skillguard-sol.vercel.app/`
- `https://skillguard-sol.vercel.app/demo`

The animated video does not need to copy the site page one-to-one, but it should
reuse the same component language: dark frame, compact cards, phone-shaped app
mock, mint/amber/red/violet status states, and concise product copy.

## Actual Home Layout

The home page is structured like this:

1. Sticky dark header.
2. Hero section with copy on the left and a tall phone demo on the right.
3. Problem section with three cards.
4. Solution section with five compact step cards.

Hero section implementation pattern:

```tsx
<section className="relative min-h-[760px] overflow-hidden rounded-2xl border border-border-subtle bg-bg-900/70 px-4 py-8 sm:px-7 lg:min-h-[700px] lg:px-10">
  <div className="section-grid pointer-events-none absolute inset-0" />
  <div className="relative z-10 grid min-h-[680px] items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.72fr)]">
    <HeroCopy />
    <PhoneDemo />
  </div>
</section>
```

Header pattern:

```tsx
<header className="sticky top-4 z-40 flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-bg-950/88 px-3 py-3 backdrop-blur-xl sm:px-4">
  <Link to="/" className="flex items-center gap-3">
    <img src={iconMark} alt="SkillGuard icon" className="h-10 w-10 rounded-lg" />
    <p className="text-sm font-semibold text-text-primary">SkillGuard</p>
  </Link>
  <nav className="hidden items-center gap-1 lg:flex">...</nav>
</header>
```

Hero copy:

```text
Status pill: Wallet firewall for onchain AI agents
Headline: Give AI agents wallet access without giving up control.
Subhead: SkillGuard is a transaction firewall for onchain AI agents. Pair an agent, define exactly what it can do, auto-allow low-risk work, require consent for spending, block out-of-policy requests, and revoke access anytime.
Primary CTA: Open the 3-minute demo
Secondary CTA: See how it works
```

Proof points under hero copy:

```text
Allow -> Low-risk automation
Ask -> Spending approval
Block -> Out-of-policy requests
Revoke -> Agent access instantly
```

## Actual Phone Demo Component

The real site phone is the most important component reference for the video.
Replicate this shape and density.

Outer phone frame:

```tsx
<div className="mx-auto w-full max-w-[356px]">
  <div className="rounded-[40px] border border-white/10 bg-black p-2 shadow-[0_34px_95px_rgba(0,0,0,0.48)]">
    <div className="flex h-[690px] max-h-[calc(100vh-7rem)] min-h-[620px] flex-col overflow-hidden rounded-[32px] border border-border-subtle bg-bg-900">
      ...
    </div>
  </div>
</div>
```

Phone header:

```tsx
<div className="flex items-center justify-between border-b border-border-subtle px-4 pb-3 pt-5">
  <div className="flex items-center gap-3">
    <img src={iconMark} alt="" className="h-8 w-8 rounded-lg" />
    <p className="text-base font-extrabold tracking-[0]">SkillGuard</p>
  </div>
  <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold">
    Needs approval
  </span>
</div>
```

Bottom tabs:

```text
Home
Inbox
Agents
Pair
Activity
```

Tab bar pattern:

```tsx
<div className="grid grid-cols-5 gap-1 border-t border-border-subtle bg-bg-950 px-2 pb-2 pt-2 text-[10px] font-extrabold text-text-muted">
  ...
</div>
```

## Phone Screens To Recreate

### Home

Use the same state shape:

```text
Badges: devnet, live api
Primary message: 1 agent request needs review. / Your wallet is guarded.
Metrics: Pending, Agents, Blocked, History
Wallet: 13hF...op4Q
Actions: Review, Pair
```

### Inbox

Use this exact content for the paid approval beat:

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

Use this exact content:

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

For the video, when showing auto-approval, make `Allow under limits` selected.
When showing paid approval, show that spending still routes to mobile approval.

### Pair

Use this exact content:

```text
Pair agent
Scan a trusted agent QR. Importing creates a wallet-scoped permission, not a private-key handoff.
Scan pairing QR
Loaded agent: Research Agent
Button: Sign & import agent
```

### Activity

Use these two states:

```text
Auto-approved zero-spend:
Scan wallet for risky token approvals
Auto-approved by policy
No wallet signature needed

Wallet-approved spend:
Weekly wallet risk report
Approved
Wallet-approved execution. Receipt and signed transaction are visible on Solana Explorer.
```

## Actual Section Components

Section header:

```tsx
<div className="max-w-3xl">
  <p className="text-sm font-semibold text-brand-mint">{kicker}</p>
  <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
    {title}
  </h2>
  <p className="mt-4 text-base leading-7 text-text-secondary">{text}</p>
</div>
```

Feature card:

```tsx
<div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
  <Icon className="h-5 w-5 text-brand-blue" />
  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
  <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
</div>
```

Hero button:

```tsx
approval-gradient inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-bg-950 transition hover:brightness-110
```

Status pill:

```tsx
inline-flex items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/10 px-3 py-1.5 text-sm font-medium text-brand-mint
```

## Problem Cards

Use these exact problem card titles if you need a visual section:

```text
Useful agents need wallet access
Private keys are the wrong interface
All-or-nothing consent does not scale
```

## Solution Steps

Use these exact step names:

```text
Pair
Configure
Filter
Sign
Prove
```

## Demo Cards

The current site demo cards still summarize the older four-step view. For the
final video, use the updated five-beat sequence from `MASTER_BRIEF.md`:

```text
1. Pair
2. Auto-allow 0 SOL
3. Approve 0.001 SOL
4. Block 0.05 SOL
5. Revoke
```

## Visual Rule

The animated video should look as if the site's `PhoneDemo` and card system were
recomposed into a motion story. Do not create a different brand system.
