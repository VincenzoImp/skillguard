# Roadmap

Status: public implementation roadmap for the hackathon MVP.

## Build Principle

Build the smallest credible mobile-first vertical slice:

> Connect wallet -> connect agent -> set permissions -> agent requests action -> policy check -> Android approval -> Mobile Wallet Adapter signing -> Solana devnet receipt.

Everything else is optional until that works.

## Milestone 0: Mobile And Receipt Spike

Goal: prove the hardest unknown before committing to SkillGuard.

Tasks:

1. Create or scaffold a minimal React Native Android app using Solana Mobile tooling.
2. Add Mobile Wallet Adapter dependencies and required React Native polyfills.
3. Install an MWA-compliant wallet or fake wallet on emulator/device.
4. Authorize wallet on devnet.
5. Sign or sign-and-send one simple devnet transaction.
6. Create a tiny Anchor program or reuse a temporary memo transaction if the program is not ready.
7. Write spike result note:
   - device/emulator used
   - wallet used
   - transaction signature
   - blockers
   - final go/no-go recommendation

Exit criteria:

- Android app runs.
- Wallet authorization works.
- One devnet transaction can be signed from the app.
- We know whether MWA is viable for the hackathon schedule.

Cut line:

- If MWA blocks for more than a focused spike, switch to Access402 or web-first SkillGuard.

## Milestone 1: Action Manifest And Policy Engine

Goal: create the data contract between agent, backend, mobile app, permissions, and program.

Deliverables:

- `AgentRegistration` TypeScript type.
- `AgentConnection` TypeScript type.
- `ActionManifest` TypeScript type.
- Canonical JSON hash function.
- `Policy` TypeScript type.
- Deterministic `evaluatePolicy(manifest, policy)` function.
- Fixtures:
  - safe wallet-risk action
  - unsafe overspend action
  - optional LI.FI route-preview action

Rules:

- connected agent must be active.
- revoked agent is blocked.
- allowed protocols
- max spend
- approval mode: ask, allow under limits, block
- accepted mints
- network allowlist
- expiry
- unknown program rejection

Tests:

- same manifest always hashes to same value.
- safe action passes.
- overspend action fails.
- expired action fails.
- unsupported protocol fails.
- revoked agent fails.
- block mode rejects.

Exit criteria:

- Backend and mobile can render the same manifest.
- Policy result is deterministic and testable.

## Milestone 2: Solana Program

Goal: deploy a small but meaningful Anchor program to devnet.

Accounts:

- `UserProfile`
- `AgentConnection`
- `AgentPolicy`
- `ActionReceipt`

Instructions:

- `create_user_profile`
- `connect_agent`
- `update_policy`
- `revoke_agent`
- `create_policy`
- `disable_policy`
- `record_decision`
- `attach_execution_signature`

Tests:

- user creates policy.
- user connects agent.
- user updates policy.
- user revokes agent.
- active policy can record approval.
- inactive policy rejects new receipts.
- revoked agent cannot record new approvals.
- rejection receipt stores failed policy result hash.
- duplicate action id is handled idempotently or rejected.
- unauthorized recorder is rejected.

Exit criteria:

- Anchor tests pass.
- Program deployed on devnet.
- Program ID and example PDAs are in README.
- A manifest verifier can match a local manifest hash to a receipt account.

## Milestone 3: SkillGuard API

Goal: host pending agent requests and prepare receipt transactions.

Endpoints:

- `POST /api/agents/register`
- `POST /api/agents/connect-link`
- `GET /api/agents/:agentId`
- `POST /api/connections`
- `PATCH /api/connections/:connectionId/policy`
- `POST /api/connections/:connectionId/revoke`
- `POST /api/actions`
- `GET /api/actions/pending?wallet=...`
- `GET /api/actions/:actionId`
- `POST /api/actions/:actionId/evaluate`
- `POST /api/actions/:actionId/receipt/approval-tx`
- `POST /api/actions/:actionId/receipt/rejection-tx`
- `POST /api/actions/:actionId/execution-signature`

Behavior:

- action is received as manifest JSON.
- agent connection is checked.
- manifest is canonicalized and hashed.
- policy is loaded for user/agent.
- policy result is computed.
- backend returns a mobile-friendly action summary.
- backend prepares transaction or instruction data for the mobile app.
- backend sends webhook callback to demo agent after approval/rejection.

Storage:

- SQLite or lightweight file-backed DB for MVP metadata.
- Solana stores policy and receipt facts.

Exit criteria:

- A demo agent can register or be seeded.
- User can connect that agent.
- A fixture action appears in mobile inbox.
- Backend returns policy result and receipt transaction payload.
- Receipt can be written to devnet.
- Demo agent receives status callback.

## Milestone 4: Android App

Goal: make the project understandable in one minute.

Screens:

- Onboarding
  - connect wallet
  - create profile

- Connected Agents
  - agent list
  - active/revoked status

- Permission Editor
  - approval mode
  - max spend
  - allowed protocols
  - expiry
  - revoke button

- Inbox
  - pending agent actions
  - status badge: safe, blocked, expired

- Action Detail
  - agent name
  - natural language summary
  - network badge
  - protocol list
  - spend impact
  - policy check result
  - risk signals
  - approve / reject buttons

- Receipt
  - status
  - manifest hash
  - policy account
  - receipt account
  - transaction signature
  - explorer link

Wallet:

- Use Mobile Wallet Adapter as primary path.
- Connect on devnet.
- Sign/sign-and-send the approval or rejection receipt transaction.

Exit criteria:

- APK runs on Android emulator or device.
- User can connect a demo agent.
- User can edit permissions.
- User can approve one action and reject one action.
- User can revoke the agent.
- Receipt state appears in app and explorer.

## Milestone 5: Demo Workflows

Goal: create a judge-ready story.

Workflow A: connect and configure agent.

1. User connects wallet.
2. User connects Research Agent.
3. User chooses `Ask every time` and max spend.
4. Agent connection/policy is visible in app.

Workflow B: blocked action.

1. Agent asks to spend more than policy allows.
2. Mobile app flags the violation.
3. User taps reject.
4. Rejection receipt is written on devnet.

Workflow C: approved action.

1. Agent asks to buy or generate a wallet-risk snapshot.
2. App shows low-risk summary and cost.
3. User approves.
4. Approval receipt is written on devnet.
5. Receipt verifier confirms the manifest hash.

Workflow D: revoke agent.

1. User opens agent detail.
2. User revokes Research Agent.
3. Agent submits another request.
4. SkillGuard blocks it because connection is revoked.

Optional Workflow E: LI.FI route preview.

1. Agent asks to fund Solana wallet from another chain.
2. Backend fetches LI.FI route.
3. Mobile app shows route and policy impact.
4. User approves or rejects the route preview.

Optional Workflow F: x402 paid report.

1. Agent requests a paid risk report.
2. SkillGuard shows x402 payment requirement.
3. User approves.
4. Payment/report receipt is linked to the approval receipt.

## Milestone 6: Submission Package

Required assets:

- [x] public GitHub repo remote configured: `https://github.com/VincenzoImp/skillguard.git`
- [x] README with setup, architecture, demo flow, and security boundary
- [x] local debug Android APK build
- [x] local standalone debug-signed Android APK build
- [ ] store-ready signed Android APK
- [x] Solana program ID reserved in Anchor workspace: `HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam`
- [x] deployed devnet addresses
- [x] demo transaction signatures
- [ ] demo video under 3 minutes
- [x] architecture diagram in README
- [x] source links and sponsor integration notes in docs

Current package status:

```text
Ready locally:
  protocol tests
  API tests
  SDK tests
  demo-agent tests
  mobile typecheck/tests/doctor
  Anchor build/tests
  devnet program deploy proof
  MWA signing proof: 4Tf8p2Rn8TYCqsLeQKNWnBudeEhhErwsczZ1XgFycuJzh7FRj6vpvZTtmekbKZX6UfqfDYYRdxDdGJuinv37f987
  debug APK build: build/mobile/skillguard-debug.apk
  standalone local APK build: build/mobile/skillguard-standalone-debugsigned.apk
  local demo orchestration

Not yet submission-ready:
  store-ready release signing
  store-ready signed APK
  public hosted site
  final video
```

Devnet deployment:

- Program ID: `HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam`
- Deploy signature: `5qQzTVjGXrGQiMRAD6vaSt3aKTXLHVB7SwZBtfxoYFPZ753hdeSp2gVLavVBNZtXrsF6cdJ5QQHa4GVkdp6mrtom`
- ProgramData address: `3sFMAGAUY2KwcE9PsM1peQisLkzXWfAjsqXHZR9aZ3By`
- IDL account: `7DosFKnbsmXM1CFM2gAi1Y5AUuRqBE31RjFJtU5osz46`

MWA demo transaction:

- Wallet: `Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx`
- Signature: `4Tf8p2Rn8TYCqsLeQKNWnBudeEhhErwsczZ1XgFycuJzh7FRj6vpvZTtmekbKZX6UfqfDYYRdxDdGJuinv37f987`
- Slot: `461031097`
- Memo: `SkillGuard receipt 2f4a9d3e5c6b7a18d91c`
- Status: finalized on devnet with `Status: Ok`.

Solana Mobile specific:

- signed APK
- app icon
- screenshots
- app metadata
- publisher portal submission if possible
- note if review is pending

## Recommended Tech Stack

Mobile:

- React Native / Expo custom dev build or React Native CLI.
- Solana Mobile scaffold/template where possible.
- Mobile Wallet Adapter.
- `@solana/web3.js`.
- Anchor client only if polyfills are stable; otherwise use generated instructions from backend.

Solana:

- Anchor/Rust.
- Devnet deployment.
- Local tests with Anchor.

Backend:

- TypeScript.
- Fastify, Express, or Next.js API routes.
- SQLite or simple local DB.
- `@solana/web3.js`.

Agent:

- Deterministic action fixtures first.
- Solana Agent Kit integration second.
- No user private key in agent process.

Optional:

- LI.FI REST API for route preview.
- x402 Express/Hono endpoint for paid report.
- Surfpool for local simulation if time allows.

## Implementation Order

1. MWA mobile spike.
2. Action manifest and policy tests.
3. Anchor policy/receipt program.
4. Backend pending-action API.
5. Android inbox/detail/receipt UI.
6. End-to-end approval receipt.
7. End-to-end rejection receipt.
8. Demo polish and README. In progress.
9. APK signing.
10. Optional LI.FI route preview.
11. Optional x402 paid report.

## Scope Cuts

Cut first:

- full LI.FI execution
- x402 payment settlement
- live autonomous agent execution
- multiple policies per user
- marketplace of agents
- social login
- iOS
- custom wallet custody
- advanced simulation for every protocol

Never cut:

- Android app
- MWA wallet connection
- devnet receipt program
- safe and blocked action demos
- clear README explaining enforcement limits

## Open Decisions

1. Use pure React Native scaffold or Expo template?
   - Recommendation: start with Solana Mobile's recommended template and avoid Expo Go dependency.

2. Does mobile app call Anchor directly or use backend-prepared transactions?
   - Recommendation: backend prepares transactions first; mobile signs/sends. Direct Anchor client can come later.

3. Does the receipt transaction get signed by the user or backend?
   - Recommendation: user signs from mobile. This makes the mobile wallet flow meaningful.

4. Is x402 included in the first demo?
   - Recommendation: no. Add only after MWA plus receipt are stable.

5. Is Solana Agent Kit live in the first demo?
   - Recommendation: no. Start with deterministic action fixtures that are shaped like Agent Kit output. Add Agent Kit once safety flow works.

## Spike Decision Rule

After Milestone 0:

- MWA works on the Android emulator with the official mock MWA wallet, so continue with SkillGuard Mobile.
- If MWA is unstable but Android app builds: continue only if Phantom fallback still keeps the Solana Mobile requirements plausible.
- If Android build blocks: pivot to Access402 or web SkillGuard.
- If Anchor mobile integration is painful: keep Anchor interaction in backend-prepared transaction flow and sign from mobile.

This keeps the pivot cost low and prevents the project from getting trapped in mobile tooling before the product story is proven.
