# SkillGuard Architecture

## Components

```text
Demo Agent / External Agent
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
- create user connect links
- receive action manifests
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

The MVP does not claim universal wallet protection and does not give agents private keys. Token-moving actions still require user wallet signing unless a future limited delegation module is added.
