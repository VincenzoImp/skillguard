# Feasibility

Status: public feasibility summary for the hackathon MVP.

## Verdict

SkillGuard Mobile is promising, but only if the product is scoped honestly.

The winning version is not "an agent security protocol that prevents all bad transactions." That would be too broad and mostly false in an MVP. The winning version is:

> A mobile approval and audit layer for agent-proposed Solana actions, with policy checks, human-readable risk summaries, wallet signing through Mobile Wallet Adapter, and on-chain approval receipts on devnet.

Feasibility by area:

| Area | Feasibility | Notes |
|---|---:|---|
| Solana Rust program on devnet | High | Anchor policy and receipt accounts are straightforward. |
| Android APK | Medium/high | Solana Mobile docs and sample apps support React Native plus Mobile Wallet Adapter. |
| Mobile Wallet Adapter wallet connect/sign | Medium/high | Official docs support authorize, sign messages, sign transactions, and sign-and-send on Android. |
| Anchor program integration from mobile | Medium | Official Solana Mobile Anchor guide exists, but React Native polyfills and Anchor version constraints must be respected. |
| Agent action generation | Medium | Solana Agent Kit is real and broad, but should not be allowed to directly sign in the MVP. |
| True security enforcement | Medium/low | Receipt-only programs do not block out-of-band wallet transactions. Enforcement is real only inside SkillGuard-mediated flows. |
| LI.FI integration | Medium | Route preview is easy; full cross-chain execution is likely mainnet and should be optional. |
| x402 bonus module | Medium | Useful as a paid risk report or paid tool receipt, but should not define the product. |
| dApp Store submission | Medium/low | APK is feasible; review and publisher setup are operational risks. |

My confidence is not high because the Solana Skills page was impressive. It is higher because that page changed the competitive map: "agents can do Solana actions" is already becoming table stakes, while "humans can safely approve and audit those actions on mobile" is a clearer gap.

## Current Implementation Status

The MVP has moved from concept into a local vertical slice.

Implemented and tested locally:

- shared `ActionManifest` and `AgentPolicy` TypeScript contracts
- canonical manifest hashing
- deterministic policy evaluation for safe, unsafe, expired, blocked, and revoked paths
- API endpoints for agents, connections, pending actions, policy evaluation, decisions, and revocation
- demo agent CLI that submits safe, unsafe, and revoked requests
- reusable TypeScript SDK for agent developers
- Anchor program for user profiles, agent connections, policies, revocation, decision receipts, and execution signature hashes
- mobile approval demo screens for wallet connect, agents, permission editor, inbox, action detail, and receipt timeline
- Android package metadata and a reproducible local APK build script
- local orchestration script for API, site, and demo-agent flows

Still pending for the hackathon submission:

- manual Android wallet signing verification with a real or fake MWA-compatible wallet
- final store-ready signed APK
- final demo screenshots, deployed public site, and demo video

Local APK build proof:

- Debug command: `. scripts/dev-env.sh && scripts/build-mobile-apk.sh`
- Debug result: `BUILD SUCCESSFUL` in 6m 48s on May 8, 2026.
- Debug artifact: `build/mobile/skillguard-debug.apk` at 188 MB.
- Standalone feasibility command: `. scripts/dev-env.sh && cd apps/mobile/android && ./gradlew assembleRelease`
- Standalone feasibility result: `BUILD SUCCESSFUL` in 3m 15s on May 8, 2026.
- Standalone artifact: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk` at 101 MB.
- Standalone packaging command: `. scripts/dev-env.sh && SKILLGUARD_ANDROID_BUILD_PROFILE=standalone scripts/build-mobile-apk.sh`
- Standalone packaging result: `BUILD SUCCESSFUL` in 13s on May 8, 2026.
- Standalone packaged artifact: `build/mobile/skillguard-standalone-debugsigned.apk` at 101 MB.

Devnet deployment proof:

- Program ID: `HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam`
- Deploy signature: `5qQzTVjGXrGQiMRAD6vaSt3aKTXLHVB7SwZBtfxoYFPZ753hdeSp2gVLavVBNZtXrsF6cdJ5QQHa4GVkdp6mrtom`
- ProgramData address: `3sFMAGAUY2KwcE9PsM1peQisLkzXWfAjsqXHZR9aZ3By`
- IDL account: `7DosFKnbsmXM1CFM2gAi1Y5AUuRqBE31RjFJtU5osz46`
- `solana program show HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam` returns the program on devnet.

## What Changed After The Skills Review

The Solana Skills directory showed that many protocol integrations are already packaged for agents:

- swaps and DeFi: Jupiter, Raydium, Orca, Meteora, Kamino, Lulo, MarginFi
- infrastructure: Helius, QuickNode, Light Protocol, MagicBlock
- wallet and agents: Phantom Connect, Phantom Wallet MCP, Solana Agent Kit
- data and paid APIs: MetEngine, wallet-analysis, QuickNode x402, Birdeye
- security workflows: vulnhunter and code recon skills

This weakens the originality of "AI agents can call Solana tools" and "agents can pay APIs." Those are already visible. SkillGuard is stronger because it sits after those skills:

```text
Solana Skills / Solana Agent Kit
  -> agent proposes an action
  -> SkillGuard normalizes it into a manifest
  -> policy engine checks it
  -> Android app explains it
  -> wallet signs only after user approval
  -> Solana program records approval or rejection
```

That is a better product wedge than adding one more agent payment API.

## Product Boundary

### What SkillGuard Can Claim

- It gives users a mobile approval inbox for agent-proposed Solana actions.
- It checks an action against user policy before asking for wallet approval.
- It records policy decisions and approval receipts on Solana devnet.
- It can prevent execution inside the SkillGuard flow when an action violates policy.
- It makes agent actions understandable enough for non-expert judges.

### What SkillGuard Must Not Claim

- It cannot stop a user from signing the same transaction outside SkillGuard.
- It cannot protect wallets if an agent has a private key or delegated authority elsewhere.
- It cannot guarantee all downstream protocol behavior from a transaction summary alone.
- It is not a complete wallet firewall unless every signing path routes through SkillGuard.

This distinction matters. Judges will trust the project more if the README is precise.

## Recommended MVP Scope

Build one polished vertical slice:

```text
Agent asks permission to run a wallet-risk snapshot and record an approval receipt.
```

Demo scenes:

1. Unsafe request:
   - Agent proposes an action over the policy limit.
   - SkillGuard flags it.
   - User rejects it.
   - Rejection receipt is recorded on devnet.

2. Safe request:
   - Agent proposes a small devnet action or paid risk-report action.
   - App shows cost, protocol, wallet impact, and risk level.
   - User approves through the Android app.
   - Wallet signs the receipt transaction through Mobile Wallet Adapter.
   - Receipt appears in the mobile timeline and on Solana Explorer.

3. Optional route preview:
   - Agent proposes cross-chain funding through LI.FI.
   - App shows route, chain, destination wallet, estimated output, and warnings.
   - Execution is optional and clearly marked as mainnet-only if used.

## Technical Architecture

```text
Agent worker
  -> uses deterministic fixtures first, Solana Agent Kit later
  -> creates ActionManifest JSON

SkillGuard API
  -> canonicalizes manifest
  -> computes manifest hash
  -> simulates or estimates wallet impact
  -> checks policy
  -> stores pending action
  -> prepares receipt instruction

Android app
  -> fetches pending actions
  -> displays action, policy result, risk signals
  -> connects wallet using Mobile Wallet Adapter
  -> approves or rejects
  -> signs/sends receipt transaction

Solana program
  -> stores AgentPolicy account
  -> stores ApprovalReceipt account
  -> stores rejection receipt when blocked
  -> optionally attaches execution signature later
```

## Action Manifest

The manifest is the product's key abstraction. It turns messy agent output into something a policy engine and mobile app can reason about.

Recommended fields:

```json
{
  "schema_version": "skillguard.action.v1",
  "action_id": "uuid-or-deterministic-id",
  "agent_id": "agent-name-or-pubkey-hash",
  "user_wallet": "base58-wallet",
  "network": "solana-devnet",
  "kind": "wallet_risk_report",
  "title": "Buy wallet-risk snapshot",
  "summary": "Pay for a risk report and record approval receipt",
  "protocols": ["skillguard", "x402"],
  "spend": [
    {
      "mint": "SOL",
      "amount_atomic": "5000",
      "human": "0.000005 SOL",
      "reason": "devnet receipt transaction fee estimate"
    }
  ],
  "accounts_touched": [],
  "risk_signals": [
    {
      "level": "low",
      "code": "NO_TOKEN_TRANSFER",
      "message": "This action only records a receipt"
    }
  ],
  "raw_transaction_ref": null,
  "created_at": 1778265600,
  "expires_at": 1778269200
}
```

Implementation detail:

- Hash a canonical JSON representation of the manifest.
- Store only the hash and compact decision fields on-chain.
- Store the full manifest off-chain for UI and demo readability.

## Solana Program Feasibility

Framework: Anchor.

Network: devnet.

Recommended accounts:

- `AgentPolicy`
  - owner wallet
  - agent id hash
  - allowed protocol hash or bitmap
  - max spend amount
  - accepted mint hash or enum
  - expiry timestamp
  - active flag
  - bump

- `ApprovalReceipt`
  - policy account
  - user wallet
  - agent id hash
  - action id hash
  - manifest hash
  - decision status: approved, rejected, expired
  - risk score
  - policy result hash
  - execution signature hash optional
  - created timestamp
  - bump

Recommended instructions:

- `create_policy`
- `disable_policy`
- `record_approval`
- `record_rejection`
- `attach_execution_signature`

What the program proves:

- The user had a policy account.
- A specific action manifest hash was approved or rejected.
- The receipt was written by the expected wallet or authorized recorder.
- Later execution can be linked by signature hash.

What the program does not prove by itself:

- That the off-chain manifest was truthful unless the UI and backend are trustworthy.
- That every transaction by the wallet went through SkillGuard.
- That downstream protocol effects match the human summary.

Mitigation:

- Include deterministic manifest hashing in README.
- Include a verifier script that takes a manifest JSON and a receipt PDA, recomputes the hash, and confirms they match.
- For the demo, use one transaction that the mobile app itself builds, signs, and submits to the receipt program.

## Mobile Wallet Adapter Feasibility

Primary path: React Native Android app with Solana Mobile Stack and Mobile Wallet Adapter.

Validated facts from official Solana Mobile docs:

- MWA lets dApps connect to mobile wallet apps for Solana transaction and message signing.
- Android has full MWA support for dApps and wallets.
- React Native SDK support exists.
- The React Native flow supports `authorize`, `signTransactions`, `signMessages`, and `signAndSendTransactions`.
- Official examples and docs cover devnet, fake wallet testing, and Anchor integration.
- The dApp Store requires a signed APK for submission.

Engineering implications:

- This can be a real Android app, not a wrapped website.
- Devnet wallet flow is plausible.
- We should use the Solana Mobile scaffold/template instead of custom wiring from scratch.
- We should test with an MWA-compliant wallet or the fake wallet early.
- We should not target iOS for the hackathon because MWA is Android-only.

Mobile-specific risks:

- React Native crypto polyfills can consume time.
- Anchor mobile integration has version constraints; Solana Mobile docs warn about using Anchor v0.28.0 in React Native because later versions have a polyfill issue.
- Expo Go is likely insufficient for native MWA modules; use a custom dev build or React Native run-android flow.
- Store submission requires metadata, signed APK, publisher wallet, and review time.

Mitigation:

- Use Android-only scope.
- Build the APK even if store review is pending.
- Treat dApp Store submission as a deliverable, not as a dependency for the demo.
- Keep the mobile app to three screens: inbox, action detail, receipt.

## Phantom Feasibility

Phantom is useful, but it should be secondary for this specific prize path.

What Phantom helps with:

- Fallback wallet integration.
- Embedded wallet/social login demos.
- AI agent starter examples with Solana Agent Kit.
- Deep links on iOS and Android if MWA becomes painful.

Why not primary:

- The Solana Mobile track explicitly asks for Solana Mobile Stack and Mobile Wallet Adapter.
- Phantom embedded wallet setup introduces app ID, portal, OAuth/deep link configuration, and app allowlisting complexity.
- Phantom is sponsor-relevant as wallet UX, but MWA is the track-native primitive.

Recommendation:

- Primary: MWA.
- Fallback: Phantom React Native SDK only if MWA blocks the APK.
- Optional demo note: "Phantom-compatible path is possible, but the hackathon build uses MWA for Solana Mobile eligibility."

## Solana Agent Kit Feasibility

Solana Agent Kit is highly relevant, but it should be integrated carefully.

Validated from the local repo and official docs:

- It is an open-source toolkit for connecting AI agents to Solana protocols.
- It exposes 60+ actions including trading, token launch, lending, bridge, blinks, NFT, and market data actions.
- It supports plugin-based actions and tool adapters for Vercel AI, LangChain, OpenAI-style flows, and MCP.
- Its wallet interface expects signing methods such as `signTransaction`, `signAllTransactions`, `signAndSendTransaction`, and `signMessage`.

Important design decision:

- In the MVP, Solana Agent Kit should propose actions, not execute them directly with a user wallet.

Safer MVP path:

```text
Agent prompt
  -> selected action template
  -> ActionManifest JSON
  -> policy check
  -> mobile approval
  -> only then build/sign receipt or execution tx
```

This avoids the hardest problem: bridging a live agent's arbitrary tool execution into a mobile wallet signing session.

Possible later path:

- Implement a custom `BaseWallet` wrapper that returns unsigned transactions when `signOnly` is enabled.
- Convert those transactions into manifest previews.
- After mobile approval, ask the wallet to sign or sign-and-send.

MVP warning:

- Do not let a server-side keypair execute user-impacting actions and then call it "human approval."
- Do not store user private keys in the agent process.

## Policy Engine Feasibility

The policy engine should be small and deterministic.

Recommended initial rules:

- allowed protocols
- maximum spend per action
- accepted mint
- network must equal devnet for demo actions
- action expires after timestamp
- raw transaction must match manifest hash if present
- reject if unknown program id appears in `programs_touched`

What can be shown in UI:

- Pass/fail result.
- Exact failed rule.
- Spend limit comparison.
- Network badge.
- Protocol list.
- Risk score.

Avoid:

- Vague AI-generated risk scores as the main safety claim.
- Overpromising transaction simulation for every protocol.
- Calling route preview "execution safety."

## LI.FI Feasibility

LI.FI is useful as a secondary workflow, not the core.

Strong use:

- The agent proposes "fund my Solana wallet from another chain."
- SkillGuard asks LI.FI for a route.
- The app displays source chain, destination chain, tool, fees, expected output, and wallet impact.
- The user approves or rejects the route request.

Weak use:

- A quote widget that does not affect policy.
- A route shown only to collect a sponsor checkbox.

Recommended MVP:

- Route preview only.
- Mark execution as optional and likely mainnet.
- Keep the Solana devnet approval receipt separate from LI.FI mainnet route execution.

## x402 Feasibility

x402 should become a module, not the product.

Best x402 use inside SkillGuard:

- "Paid risk report" endpoint.
- "Paid agent tool" receipt.
- "Risk snapshot costs $0.01; approve?"

Why this is useful:

- It preserves x402 bonus relevance.
- It ties Access402 research back into the mobile approval story.
- It avoids competing head-on with pay.sh, MetEngine, wallet-analysis, and QuickNode x402.

Recommended scope:

- If time permits, add one x402-paid report endpoint after mobile and receipt flows work.
- If x402 integration takes more than a short spike, cut it and mention it as roadmap.

## Competitive Position

SkillGuard is differentiated if it is framed as:

- mobile-first human approval for agent actions
- policy checks for Solana agent workflows
- on-chain receipts for approvals and rejections
- not another agent API marketplace
- not another generic x402 paywall

Closest adjacent categories:

- Phantom MCP: lets agents request wallet operations, but does not by itself create a productized mobile approval inbox with policy receipts.
- Solana Agent Kit: lets agents perform actions, but is a toolkit rather than a consumer approval layer.
- pay.sh/x402 tools: solve paid API access, not wallet-native action approval.
- Squads/smart accounts: strong custody and multisig, but heavier than a hackathon mobile action approval UX.

## Prize Fit

### Solana

Fit: high.

Why:

- Unique Rust program.
- Devnet deploy.
- Policy and approval receipt accounts are Solana-native.
- Product reimagines how users interact with autonomous Solana agents.

Risk:

- If the Solana program only stores decorative receipts, judges may discount it.

Mitigation:

- Make policy account creation and receipt verification central to the demo.
- Show at least one rejected action recorded on-chain.
- Provide a manifest verifier script.

### Solana Mobile

Fit: high if MWA works.

Why:

- Android-first.
- Mobile approval is the core UX, not a port.
- Wallet approval is naturally mobile.
- Uses Mobile Wallet Adapter.

Risk:

- Store review takes time.
- APK build and Android signing can consume a day.

Mitigation:

- Build APK early.
- Submit as soon as the skeleton works.
- Demo APK directly if store approval is pending.

### LI.FI

Fit: medium.

Why:

- Cross-chain funding requests are a natural action type for agents.
- Route preview fits policy checks.

Risk:

- Execution likely requires mainnet funds.
- Quote-only may feel thin.

Mitigation:

- Only include LI.FI if it improves the story.
- Make policy check apply to the route.

### x402 Bonus

Fit: medium.

Why:

- Paid risk report or paid action report is coherent.

Risk:

- x402 can distract from mobile.

Mitigation:

- Do not start x402 until mobile plus receipt works.

## Key Risks

### Risk 1: Security Theater

Problem:

Receipts do not equal enforcement.

Mitigation:

- Say SkillGuard enforces policies for SkillGuard-mediated flows.
- Do not claim universal protection.
- Show a blocked request and an approved request.

### Risk 2: Mobile Integration Burns Time

Problem:

React Native, polyfills, Android signing, and MWA setup can consume the project.

Mitigation:

- Spike MWA first.
- Use the official Solana Mobile scaffold.
- Use fake wallet or devnet wallet early.
- Keep web dashboard secondary.

### Risk 3: Agent Integration Burns Time

Problem:

Live Solana Agent Kit tool execution can be too broad.

Mitigation:

- Use deterministic fixtures first.
- Add one Agent Kit generated action only after the manifest and mobile flow are stable.

### Risk 4: Sponsor Sprawl

Problem:

Trying to include Solana, Solana Mobile, LI.FI, x402, Phantom, Helius, and Agent Kit can dilute the demo.

Mitigation:

- Core: Solana plus Solana Mobile.
- Secondary: Solana Agent Kit as source of action proposals.
- Optional: LI.FI route preview.
- Optional: x402 paid risk report.

### Risk 5: Weak On-Chain Story

Problem:

If only hashes are stored, judges may ask why Solana is needed.

Mitigation:

- Explain the receipt as a public, tamper-evident action approval log.
- Include policy state on-chain, not only receipt hashes.
- Include rejection receipts, because audit trails matter for blocked agent actions.

## Go/No-Go Criteria

Proceed with SkillGuard if the spike proves:

- Android app can build and run.
- MWA can authorize a devnet wallet or fake wallet.
- App can sign or sign-and-send one devnet transaction.
- Anchor receipt program can be called from the app or backend.
- One deterministic ActionManifest can be approved and written on-chain.
- One policy failure can be rejected and written on-chain.

Pivot back to Access402 if:

- MWA or Android build remains blocked after a focused spike.
- Mobile wallet signing cannot be demonstrated quickly.
- The team cannot build a clean APK in time.

Partial fallback:

- Keep the same policy and receipt program.
- Replace Android app with web dashboard.
- Reframe as Access402 or "SkillGuard Web" for Solana core, dropping Solana Mobile prize.

## Final Judgment

I am not absolutely sure SkillGuard wins. But I am more confident in its upside than Access402 because:

- It has a clearer user problem.
- It has a stronger visual demo.
- It targets Solana Mobile directly.
- It uses the Solana Skills ecosystem instead of competing with it.
- It avoids the crowded "agents pay APIs" lane.

The honest decision is:

- Run the mobile spike first.
- If the spike works, SkillGuard is the better hackathon bet.
- If the spike fails, return to Access402 with less wasted work, because the policy/receipt model still transfers.

## Sources Checked

- Solana Mobile Wallet Adapter docs: https://docs.solanamobile.com/developers/mobile-wallet-adapter
- Solana Mobile React Native MWA direct session guide: https://docs.solanamobile.com/get-started/react-native/invoke-mwa-sessions-directly
- Solana Mobile Anchor integration guide: https://docs.solanamobile.com/recipes/solana-development/anchor-integration
- Solana Mobile build and sign APK guide: https://docs.solanamobile.com/dapp-store/build-and-sign-an-apk
- Solana Mobile submit new app guide: https://docs.solanamobile.com/dapp-store/submit-new-app
- Solana Mobile publishing CLI: https://docs.solanamobile.com/dapp-store/publishing-cli
- Solana Agent Kit docs: https://kit.sendai.fun/
- Solana Agent Kit repo cache: `research-cache/repos/solana-agent-kit`
- Mobile Wallet Adapter repo cache: `research-cache/repos/mobile-wallet-adapter`
- Phantom Connect SDK repo cache: `research-cache/repos/phantom-connect-sdk`
- Solana Skills repo cache: `research-cache/repos/sendaifun-skills`
