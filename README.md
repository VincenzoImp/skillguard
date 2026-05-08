# SkillGuard

SkillGuard is the permission layer for Solana agents.

Connect any Solana agent, control what it can do with your wallet, approve sensitive actions from mobile, revoke permissions anytime, and prove every decision on-chain.

## What It Does

SkillGuard lets users:

- connect a Solana wallet from an Android app
- connect AI agents that want to request wallet actions
- set per-agent permissions
- receive action requests in a mobile approval inbox
- approve or reject actions
- revoke agent access
- view on-chain approval and rejection receipts

SkillGuard lets agent developers:

- register an agent
- create a connect link for users
- submit action requests through an API/SDK
- receive approval or rejection callbacks
- verify action receipts on Solana

## Hackathon Scope

The MVP proves:

```text
Connect wallet -> connect agent -> set permissions -> agent requests action
-> policy check -> mobile approval/rejection -> Solana devnet receipt.
```

Core tracks:

- Solana: Anchor/Rust program on devnet.
- Solana Mobile: Android app using Mobile Wallet Adapter.

Optional extensions:

- LI.FI route preview.
- x402 paid risk report.
- Solana Agent Kit generated action manifests.

## Repository Layout

```text
apps/
  mobile/       Android app, Mobile Wallet Adapter, approval UX
  api/          SkillGuard API, policy engine, webhooks
  demo-agent/   Sample agent that integrates with SkillGuard
  site/        Public project site and visual source of truth
programs/
  skillguard/   Anchor program for agent connections, policies, receipts
packages/
  sdk/          TypeScript SDK for agent developers
docs/
  PRODUCT.md
  ROADMAP.md
  FEASIBILITY.md
  CRITICAL_FEASIBILITY_STUDY.md
  ARCHITECTURE.md
  DESIGN_SYSTEM.md
  DEMO.md
  superpowers/plans/2026-05-08-skillguard-mvp.md
assets/
  brand/
```

## Planning Docs

- [Product](docs/PRODUCT.md)
- [Critical Feasibility Study](docs/CRITICAL_FEASIBILITY_STUDY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Demo](docs/DEMO.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Operating Protocol](docs/OPERATING_PROTOCOL.md)
- [MVP Implementation Plan](docs/superpowers/plans/2026-05-08-skillguard-mvp.md)

## Development Standard

Every implementation step follows the operating protocol:

```text
test -> implement -> document -> verify -> stage -> pre-commit -> audit -> fix -> re-verify -> commit -> next step
```

See [Operating Protocol](docs/OPERATING_PROTOCOL.md).

## Demo Narrative

1. User connects wallet in the Android app.
2. User connects `Research Agent`.
3. User sets permissions.
4. Agent submits an unsafe request; SkillGuard blocks or rejects it.
5. Agent submits a safe request; user approves from mobile.
6. SkillGuard records the decision on Solana devnet.
7. User revokes the agent; future requests are blocked.

## Status

Planning, feasibility, brand assets, and the project site foundation are ready. Core MVP implementation has not been scaffolded yet.
