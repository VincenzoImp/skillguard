# SkillGuard Solana Program

Anchor workspace for SkillGuard on-chain receipts.

Current status:

- Anchor scaffold generated with `anchor init skillguard --no-git --package-manager npm`.
- SkillGuard receipt accounts and instructions are implemented.
- `anchor test` passes 12 program tests with Node 22 via `../../scripts/dev-env.sh`.

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
- `record_decision`
- `attach_execution_signature`

Local verification:

```bash
. ../../scripts/dev-env.sh
anchor build
anchor test
```

Generated ledgers, build artifacts, node modules, and keypairs under `.anchor/` and `target/` are ignored and must not be committed.
