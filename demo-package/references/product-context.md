# Product Context

## What SkillGuard Is

SkillGuard is a transaction firewall for AI agents that operate on blockchain.
It gives the wallet owner a control layer for agent-driven wallet actions.

The agent can request wallet actions. The agent cannot own the wallet. The user
defines permissions and can revoke access.

The simplest pitch is:

> Give AI agents wallet access without giving up control.

## Why It Exists

Autonomous agents become valuable when they can act. Onchain action requires
wallet authority. Direct wallet authority is dangerous. Manual approval for
everything removes autonomy. SkillGuard creates the missing policy layer between
action generation and wallet signing.

## Core Model

- `Allow`: low-risk requests can proceed under owner-defined policy.
- `Ask`: sensitive or spending requests require explicit mobile approval.
- `Block`: overspend, wrong network, unauthorized protocols, revoked agents, and
  expired permissions are denied before signing.
- `Revoke`: the user can cut off an agent at any time.

## Demo Agent

The demo uses Research Agent. It requests wallet risk analysis and a paid report.
It does not receive the user's private key.

The demo is designed to prove four verbs: pair, approve, block, revoke.
