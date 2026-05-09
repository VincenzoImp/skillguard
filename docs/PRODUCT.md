# Product Blueprint

Status: current public product definition.

## Thesis

SkillGuard is the permission layer for Solana agents.

Users connect AI agents to SkillGuard, set wallet permissions, receive mobile notifications when agents want to act, approve or reject actions, and keep verifiable on-chain receipts of every decision.

The strongest pitch:

> Connect any Solana agent. Control what it can do with your wallet. Approve sensitive actions from mobile. Revoke permissions anytime. Prove every decision on-chain.

This is stronger than the earlier "approval screen" framing because it describes a product people can use repeatedly:

- user owns the wallet
- agents request access
- permissions are explicit
- mobile app is the control center
- Solana records policies and decisions

## What The Product Is

SkillGuard has four parts:

1. Mobile app
   - wallet connection
   - connected agents list
   - permission editor
   - action notifications
   - approve/reject flow
   - activity and receipt history

2. Agent API and SDK
   - lets external agents request approval
   - lets agents receive approval/rejection callbacks
   - gives developers a simple integration path

3. Policy engine
   - checks requested actions against user rules
   - decides whether action needs approval, can be blocked, or can be auto-allowed under policy

4. Solana program
   - stores public policy state or policy hashes
   - records approval/rejection receipts
   - supports revocation and auditability

## User Experience

### 1. Onboarding

The user opens SkillGuard on Android and connects a Solana wallet through Mobile Wallet Adapter.

The app creates a user profile and default policy:

```text
Default mode: Ask every time
Network: Devnet for demo
Max spend per action: 0.05 SOL
Allowed protocols: SkillGuard demo, wallet analysis, LI.FI preview
```

### 2. Connect An Agent

The user connects an agent in one of three ways:

- scan QR code from an agent dashboard
- open a `skillguard://connect-agent/...` deeplink
- paste/connect an agent ID

The app shows:

```text
Research Agent wants to request wallet actions through SkillGuard.

Permissions:
- Request wallet-risk reports
- Request LI.FI route previews
- Request devnet receipt writes

Mode:
[Ask every time] [Allow under limits] [Block]
```

The user accepts, edits, or rejects the agent connection.

### 3. Manage Permissions

For every connected agent, the user can set:

- approval mode
- max spend per action
- daily spend cap
- allowed protocols
- allowed mints
- allowed networks
- expiry date
- notification preference
- active/revoked status

Permission modes:

| Mode | Meaning |
|---|---|
| Ask every time | Every sensitive action creates a mobile approval request. |
| Allow under limits | SkillGuard can auto-approve actions that match policy and do not require a fresh wallet signature. |
| Block | Requests from this agent are rejected. |
| Revoked | Agent connection is disabled and cannot request new actions. |

Important: in the MVP, "Allow under limits" is not unlimited wallet delegation. For token-moving actions, the user still signs unless a limited vault/delegation module exists.

### 4. Agent Requests An Action

An agent calls SkillGuard:

```http
POST /api/actions
```

with an action manifest:

```json
{
  "agent_id": "research-agent",
  "user_wallet": "7xK...",
  "type": "wallet_risk_report",
  "summary": "Generate a wallet risk snapshot",
  "protocols": ["skillguard", "x402"],
  "network": "solana-devnet",
  "estimated_spend": {
    "mint": "SOL",
    "amount": "0.005"
  },
  "callback_url": "https://agent.example.com/skillguard/callback"
}
```

SkillGuard returns:

```json
{
  "status": "pending_user_approval",
  "action_id": "act_123",
  "approval_url": "skillguard://actions/act_123"
}
```

### 5. User Receives Notification

The mobile app notifies the user:

```text
Research Agent wants to use your wallet
0.005 SOL estimated spend
Policy: within limit
```

For the MVP, this can be implemented as an in-app pending request feed first. Push notifications are a strong polish feature but not required to prove the core.

### 6. User Reviews And Decides

The action detail screen shows:

- agent name
- requested action
- wallet impact
- protocols touched
- policy result
- risk signals
- manifest hash
- approve/reject buttons

User options:

- Approve once
- Reject
- Allow similar actions under this policy
- Edit permissions
- Revoke agent

### 7. SkillGuard Records The Decision

If approved:

- mobile wallet signs the approval/receipt transaction
- SkillGuard program records an approval receipt
- the agent receives an approval callback

If rejected:

- app records a rejection receipt
- agent receives a rejection callback with reason

Example callback:

```json
{
  "action_id": "act_123",
  "status": "approved",
  "receipt_pda": "Receipt...",
  "decision_signature": "5x...",
  "manifest_hash": "..."
}
```

## Developer Integration

SkillGuard should feel easy for other projects to adopt.

### Integration Model

External project flow:

```text
Agent app
  -> register agent with SkillGuard
  -> publish pairing link with agent public key
  -> ask user to connect SkillGuard
  -> submit signed action requests
  -> wait for approval webhook
  -> execute only after approval
```

### Minimal SDK Surface

For hackathon, expose a small TypeScript SDK wrapper:

```ts
const skillguard = new SkillGuardClient({
  agentId: "research-agent",
  agentSigner,
  apiUrl: "https://skillguard-sol.vercel.app/api",
});

const request = await skillguard.requestApproval({
  agentId: "research-agent",
  userWallet: "7xK...",
  action: {
    type: "wallet_risk_report",
    summary: "Generate a wallet risk snapshot",
    protocols: ["x402", "helius"],
    estimatedSpend: { mint: "SOL", amount: "0.005" },
  },
  callbackUrl: "https://agent.example.com/callback",
});
```

Useful endpoints:

- `POST /api/agents`
- `POST /api/wallet-sessions`
- `POST /api/connections`
- `GET /api/agents/:agentId`
- `POST /api/actions`
- `GET /api/actions/:actionId`
- `POST /api/actions/:actionId/decision`

Developer-facing outputs:

- pending approval URL
- action status
- approval/rejection webhook
- receipt PDA
- transaction signature
- manifest hash

## Solana Program Revision

The on-chain story should include connected agents, policies, and decisions.

Recommended accounts:

- `UserProfile`
  - owner wallet
  - profile bump
  - created timestamp

- `AgentConnection`
  - user wallet
  - agent id hash
  - agent metadata hash
  - active flag
  - created timestamp
  - revoked timestamp optional

- `AgentPolicy`
  - connection account
  - allowed protocols hash
  - max spend per action
  - daily cap optional
  - accepted mint hash
  - network id
  - mode: ask, allow_under_limits, block
  - expiry timestamp
  - active flag

- `ActionReceipt`
  - connection account
  - policy account
  - action id hash
  - manifest hash
  - decision: approved, rejected, auto_allowed, blocked_by_policy
  - policy result hash
  - risk score
  - execution signature hash optional
  - created timestamp

Recommended instructions:

- `create_user_profile`
- `connect_agent`
- `update_policy`
- `revoke_agent`
- `record_decision`
- `attach_execution_signature`

What this proves:

- which agents were connected
- what policy was active
- whether the user approved, rejected, or revoked
- what manifest hash was decided on
- when the decision happened

What stays off-chain:

- full agent metadata
- full action manifest
- notification state
- webhook delivery state
- private callback URLs

## Permission Feasibility

### MVP Permission Model

Feasible for the hackathon:

- user connects agent
- user sets policy
- agent submits action
- SkillGuard checks policy
- app asks user for sensitive actions
- app can auto-mark safe non-spending actions under policy
- app records approval/rejection receipt
- user can edit or revoke permissions

For token-moving actions in the MVP:

- user still signs through Mobile Wallet Adapter
- agent never gets private key
- "Allow under limits" means the app can skip extra review only for safe/non-custodial actions unless a limited delegation module is added

### Stretch Permission Model

True automatic spending requires constrained delegation.

Possible future paths:

- limited SkillGuard vault funded by user
- session key with spend/program limits
- smart account or programmable wallet integration
- Squads/Swig-style delegated authority

Recommendation:

- Mention this as future/advanced.
- Do not make it required for the hackathon MVP.
- Demo revocable policy and per-action mobile signing first.

## Revised Feasibility

| Feature | Feasibility | MVP Decision |
|---|---:|---|
| Mobile app with wallet connection | Medium/high | Required. |
| Connected agents list | High | Required. |
| Permission editor | High | Required in simple form. |
| In-app pending requests | High | Required. |
| Push notifications | Medium | Nice-to-have; polling/feed is enough for MVP. |
| Agent API | High | Required. |
| TypeScript SDK wrapper | High | Useful for demo and integration story. |
| Solana policy/receipt program | High | Required. |
| On-chain revocation | High | Required. |
| Auto-approval under limits | Medium | Only for safe/non-spending actions in MVP. |
| Automatic wallet spending by agent | Low/medium | Stretch only with vault/delegation. |
| LI.FI route preview | Medium | Optional sponsor scene. |
| x402 paid report | Medium | Optional bonus scene. |
| dApp Store submission | Medium/low | Submit if possible; APK demo is still useful. |

## Revised Roadmap

### Phase 0: Mobile Wallet Spike

Prove:

- Android app builds
- Mobile Wallet Adapter authorizes wallet
- devnet transaction can be signed
- receipt transaction can be sent

Decision:

- if this fails, pivot to Access402 or web SkillGuard
- if this works, continue SkillGuard Mobile

### Phase 1: Core Domain Model

Build:

- agent registration model
- agent connection model
- action manifest model
- policy model
- deterministic policy evaluator
- manifest hash and verifier

Output:

- tests for safe, blocked, expired, overspend, revoked
- fixture demo actions

### Phase 2: Solana Program

Build:

- `UserProfile`
- `AgentConnection`
- `AgentPolicy`
- `ActionReceipt`
- instructions for connect, update, revoke, record decision

Output:

- Anchor tests
- devnet deployment
- example accounts
- verifier script

### Phase 3: Agent API And SDK

Build:

- register agent endpoint
- connect link endpoint
- request approval endpoint
- action status endpoint
- webhook callback simulator
- tiny TypeScript SDK

Output:

- sample agent integration
- docs showing how another project connects an agent

### Phase 4: Android App UX

Build screens:

- onboarding/connect wallet
- connected agents
- permission editor
- pending requests
- action detail
- receipt/activity timeline

Output:

- APK
- one connected research agent
- one blocked request
- one approved request
- one revoked permission scene

### Phase 5: Research Agent

Build a small research agent that uses the SkillGuard SDK.

Agent capabilities:

- request wallet-risk report approval
- request LI.FI route preview approval
- request a deliberately unsafe overspend action
- receive approval/rejection callbacks

Output:

- web or CLI agent console for demo
- visible callback logs

### Phase 6: Optional Sponsor Modules

Add only if core is stable:

- LI.FI route preview
- x402 paid risk report
- Solana Agent Kit action generation

### Phase 7: Submission

Prepare:

- README
- architecture diagram
- program ID
- APK
- devnet signatures
- demo video under 3 minutes
- integration guide for agents

## Demo Story

The demo should show five moments:

1. Connect wallet
   - user opens SkillGuard mobile app
   - connects wallet through Mobile Wallet Adapter

2. Connect agent
   - research agent asks to connect
   - user chooses `Ask every time`
   - policy is recorded

3. Block unsafe action
   - agent requests action over spend limit
   - mobile app shows policy failure
   - user rejects or app blocks
   - rejection receipt appears on-chain

4. Approve safe action
   - agent requests wallet-risk report
   - app shows cost and risk
   - user approves once
   - wallet signs receipt transaction
   - approval receipt appears on-chain

5. Edit or revoke permission
   - user opens agent detail
   - changes max spend or revokes agent
   - future request is blocked

Optional final scene:

- show an external integration snippet using the SkillGuard SDK
- show webhook callback received by research agent

## What The Project Produces

For users:

- Android app
- wallet-connected permission dashboard
- notifications/inbox for agent actions
- approval and rejection history
- revocable agent permissions

For agents/developers:

- API
- TypeScript SDK
- connect links
- approval status
- webhook callbacks
- receipt verification

For Solana:

- deployed Anchor program
- policy/connection accounts
- approval/rejection receipt accounts
- devnet transaction signatures
- manifest verifier

For judges:

- visible mobile app
- real wallet connection
- real Solana program
- clear blocked/approved workflows
- proof that external agents can integrate

## Final Product Definition

SkillGuard is not just a risk screen.

It is:

```text
Agent permissions + mobile approvals + revocable wallet policies + on-chain audit receipts.
```

The MVP should prove exactly that, without pretending to solve universal wallet security.
