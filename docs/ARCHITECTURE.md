# SkillGuard Architecture

## Components

```text
Demo Agent / External Agent
  -> Ed25519-signed ActionManifest
  -> SkillGuard API
  -> Policy Engine
  -> Mobile App
  -> Mobile Wallet Adapter
  -> SkillGuard Solana Program
```

## Mobile App

The Android app is the user's control center.

Responsibilities:

- connect Solana wallet
- create a short-lived signed wallet session for private wallet reads
- display connected agents
- edit per-agent permissions
- display pending action requests
- approve or reject actions
- sign receipt transactions through Mobile Wallet Adapter
- show activity and receipt history

## API

The API is the integration surface for agents.

Responsibilities:

- register agents
- create user pairing links containing agent public keys
- receive agent-signed action manifests
- evaluate action manifests against policy
- notify the mobile app
- prepare receipt transactions
- deliver approval/rejection webhooks to agents

## Policy Engine

The policy engine decides what should happen to an action request.

Initial checks:

- agent connection is active
- agent has not been revoked
- protocol is allowed
- network is allowed
- spend is under limit
- action has not expired

## Solana Program

The Anchor program records public, verifiable state.

Core accounts:

- `UserProfile`
- `AgentConnection`
- `AgentPolicy`
- `ActionReceipt`

Core instructions:

- `create_user_profile`
- `connect_agent`
- `update_policy`
- `revoke_agent`
- `record_decision`
- `attach_execution_signature`

## Security Boundary

SkillGuard enforces policies for actions that go through SkillGuard.

The API requires wallet-owner sign-message proofs for agent connection,
policy edits, revocation, wallet-session creation, and manual decisions. Wallet
feed reads require the resulting short-lived session token. Agent submissions
require an Ed25519 proof from the registered agent public key and are bound to
the action manifest hash, action ID, connection ID, and timestamp.

The MVP does not claim universal wallet protection and does not give agents
private keys. Token-moving actions still require user wallet signing unless a
future limited delegation module is added.
