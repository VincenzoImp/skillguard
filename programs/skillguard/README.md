# SkillGuard Solana Program

Anchor workspace for SkillGuard on-chain receipts.

Current status:

- Anchor scaffold generated with `anchor init skillguard --no-git --package-manager npm`.
- SkillGuard receipt accounts and instructions are implemented.
- `anchor test` passes 12 program tests with Node 22 via `../../scripts/dev-env.sh`.
- Program is deployed on devnet as `HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam`.
- Deploy signature: `5qQzTVjGXrGQiMRAD6vaSt3aKTXLHVB7SwZBtfxoYFPZ753hdeSp2gVLavVBNZtXrsF6cdJ5QQHa4GVkdp6mrtom`.
- ProgramData address: `3sFMAGAUY2KwcE9PsM1peQisLkzXWfAjsqXHZR9aZ3By`.
- IDL account: `7DosFKnbsmXM1CFM2gAi1Y5AUuRqBE31RjFJtU5osz46`.

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

Devnet verification:

```bash
. ../../scripts/dev-env.sh
solana program show HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam
```

Generated ledgers, build artifacts, node modules, and keypairs under `.anchor/` and `target/` are ignored and must not be committed.
