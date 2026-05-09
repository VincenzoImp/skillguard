# Voiceover Script

Target length: 2:40 to 2:55. Do not render this full script as subtitles in the
HTML presentation. The video should show short micro-copy while this narration is
recorded separately.

## 0:00-0:15 Hook

AI agents are starting to operate onchain. They can research wallets, monitor
markets, prepare transactions, and automate blockchain workflows. But the moment
an agent needs a wallet with real funds, the user faces a dangerous choice.

## 0:15-0:35 The Struggle

If I give the agent my personal wallet, I risk everything in that wallet. If I
give it a separate funded wallet, I still risk those funds. And if I approve
every transaction manually, the agent is no longer really autonomous.

## 0:35-0:55 The Missing Layer

Wallets can sign. Agent frameworks can create actions. What is missing is a
control layer between them: something that lets agents request wallet actions
without handing them your wallet.

## 0:55-1:15 Solution

SkillGuard is a wallet firewall for AI agents. Agents can request onchain
actions, but SkillGuard checks each request against permissions owned by the
wallet user. It can Allow, Ask, or Block before anything reaches signing.

## 1:15-1:35 How It Works

The user pairs an agent, sets limits, and decides what can proceed
automatically, what needs explicit consent, and what must be denied. The agent
never receives the private key. It only submits signed action manifests and waits
for a decision.

## 1:35-2:25 Real Demo

Here is the real demo. I connect my wallet, scan a QR, and import Research
Agent. This agent can ask for wallet analysis, but it cannot freely spend.

First, it submits a safe zero-spend request. That can be allowed under policy.
Then it asks for a paid report that spends `0.001 SOL`. Because money moves,
SkillGuard routes the request to the mobile app. I review the manifest, approve
it, and only then does my wallet sign.

Next, the agent asks for a larger subscription upgrade. This one exceeds my
limit, so SkillGuard blocks it before any signature prompt. Finally, I revoke the
agent, and future requests from that agent are denied.

## 2:25-2:45 Proof

This is not a mockup. The Android app uses Mobile Wallet Adapter. The hosted API
runs on Vercel. The research agent is a real worker. Approved decisions are
recorded as Solana devnet receipts.

## 2:45-2:55 Close

SkillGuard lets AI agents use wallets safely, without ever owning the wallet.
Agents can act. Users stay in control.
