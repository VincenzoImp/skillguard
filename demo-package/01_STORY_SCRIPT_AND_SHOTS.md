# SkillGuard Story, Script, And Shots

This file gives the video agent all narrative context in one place. Do not
render the full voiceover as subtitles. Use short micro-copy on screen while the
voiceover is recorded separately.

## Product In One Line

SkillGuard is the wallet firewall for AI agents operating onchain.

## The User Struggle

AI agents become valuable when they can act: scan wallets, monitor risk, pay for
reports, claim rewards, route swaps, rebalance positions, or prepare execution.
Onchain action eventually needs wallet authority.

Without SkillGuard, the user has three bad choices:

1. Give the agent a personal wallet or signer and risk everything in it.
2. Fund a separate agent wallet and still risk that funded balance.
3. Manually approve every action and remove the agent's autonomy.

SkillGuard is the fourth path: the agent can request wallet actions, but every
request passes through wallet-owned policy before signing.

## Product Model

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

Important boundary:

Do not claim that SkillGuard automatically signs spending transactions with the
user's wallet. Auto-approval is intentionally narrow and only applies to
low-risk zero-spend requests. Any request that spends SOL, references a raw
transaction, or has higher risk still requires explicit wallet approval through
Mobile Wallet Adapter.

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

### 0:00-0:12 Hook

AI agents are becoming useful onchain only when they can act: pay, route,
rebalance, claim, report, and execute. But the moment an agent needs wallet
access, real funds are at risk.

### 0:12-0:34 The Struggle

Today the choices are bad. Give the agent my personal wallet, and I risk
everything in it. Fund a separate wallet, and I still risk that balance. Approve
every transaction manually, and the agent is no longer autonomous.

### 0:34-0:52 The Missing Layer

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

## Shot List

### Shot 1: Hook, 0:00-0:12

Visual: AI agent node moving toward a wallet with visible funds, then a hard
warning barrier appears before contact.

Micro-copy:

- `Useful agents need wallet access`
- `Wallet access means real fund risk`

### Shot 2: Struggle, 0:12-0:34

Visual: three unsafe options in parallel.

Cards:

- `Give agent my wallet` / `Too risky`
- `Fund a separate wallet` / `Still risky`
- `Approve everything manually` / `Not autonomous`

### Shot 3: Product Reveal, 0:34-1:15

Visual: SkillGuard between Agent and Wallet.

Micro-copy:

- `Wallet firewall for AI agents`
- `Give agents wallet access without giving up control`
- `Allow / Ask / Block / Revoke`

### Shot 4: How It Works, 1:15-1:34

Visual: six-step flow.

Steps:

- `Pair agent`
- `Set policy`
- `Agent requests`
- `SkillGuard filters`
- `Wallet approves`
- `Solana receipt`

### Shot 5: Pairing, 1:34-1:48

Visual: real Android app picture-in-picture if available, otherwise recreated
phone screen.

Show:

- Home with connected devnet wallet.
- Pair tab.
- QR scan.
- Research Agent imported.

Overlay micro-copy: `Pair an agent by QR`

### Shot 6: Auto-Allowed Zero-Spend, 1:48-1:58

Visual: phone frame plus animated policy panel.

Show:

- Agent mode `Allow under limits`.
- Free scan request, spend `0 SOL`.
- Activity state: auto-approved / no wallet signature needed.

Overlay micro-copy:

- `Low-risk work can auto-approve`
- `No funds moved`

### Shot 7: Paid Approval, 1:58-2:15

Visual: phone inbox plus policy panel.

Show:

- Inbox request.
- Spend `0.001 SOL`.
- Approve in wallet.
- Activity receipt.

Overlay micro-copy: `Spending requires consent`

### Shot 8: Blocked Overspend, 2:15-2:25

Visual: policy line stops before the wallet.

Show:

- `0.05 SOL` request.
- `Blocked`
- `Exceeds 0.01 SOL max`

Overlay micro-copy: `Blocked before signing`

### Shot 9: Technical Proof, 2:25-2:45

Visual: compact proof grid.

Cards:

- `Android app`
- `Mobile Wallet Adapter`
- `Vercel API`
- `Research Agent`
- `Anchor program`
- `Solana devnet receipt`

### Shot 10: Closing, 2:45-2:55

Visual: agent continues working while wallet remains locked behind SkillGuard.

Final line:

```text
Agents can act. Users stay in control.
```

## If Runtime Is Tight

Do not cut the hook, the paid approval, the blocked overspend, or the revoke
moment. If time is tight, shorten the architecture flow and proof grid. Keep the
auto-approval beat if it is clean because it proves that SkillGuard preserves
agent autonomy without giving agents custody.
