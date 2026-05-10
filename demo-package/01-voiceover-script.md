# Voiceover Script

Target length: 2:40 to 2:55. Do not render this full script as subtitles in the
HTML presentation. The video should show short micro-copy while this narration is
recorded separately.

## 0:00-0:12 Hook

AI agents are becoming useful onchain only when they can act: pay, route,
rebalance, claim, report, and execute. But the moment an agent needs wallet
access, real funds are at risk.

## 0:12-0:34 The Struggle

Today the choices are bad. Give the agent my personal wallet, and I risk
everything in it. Fund a separate wallet, and I still risk that balance. Approve
every transaction manually, and the agent is no longer autonomous.

## 0:34-0:52 The Missing Layer

Wallets can sign. Agent frameworks can generate actions. What is missing is the
control layer between them: a way to give agents wallet access without giving up
control.

## 0:52-1:15 Solution

SkillGuard is that layer: a wallet firewall for AI agents. Agents submit signed
action manifests. SkillGuard checks wallet-owned policy and decides whether to
Allow, Ask, Block, and Revoke before anything reaches signing.

## 1:15-1:34 How It Works

The owner pairs an agent, sets limits, and decides what can proceed
automatically, what needs explicit consent, and what must be denied. The agent
never receives the private key. It waits for a wallet-owned decision.

## 1:34-2:25 Real Demo

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

## 2:25-2:45 Proof

This is not a mockup. The Android app uses Mobile Wallet Adapter. The hosted API
runs on Vercel. The research agent is a real worker. Wallet-approved spending
decisions are recorded as Solana devnet receipts tied to the action manifest.

## 2:45-2:55 Close

SkillGuard gives AI agents wallet access without giving up control. Agents can
act. Users stay in control.
