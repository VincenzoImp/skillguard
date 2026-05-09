# Visual Storyboard

## Visual Language

Use the existing SkillGuard style: dark background, mint approval state, blue
network/proof state, violet permission state, red blocked state. Keep cards
compact. Do not use decorative orbs or marketing fluff.

## Scene Layouts

### Scene A: Agent-to-Wallet Risk

Full-screen dark grid. Left side: `AI Agent`. Right side: `Wallet + Funds`.
Animate a line from agent to wallet. Before it connects, show a warning barrier:
`Unrestricted signer access`.

### Scene B: The Bad Tradeoff

Three columns with simple icons:

1. Personal wallet -> `Risk everything`.
2. Separate wallet -> `Risk funded balance`.
3. Manual approvals -> `No autonomy`.

### Scene C: SkillGuard Firewall

Place SkillGuard between agent and wallet. Animate requests hitting the firewall
and splitting into:

- `Allow`: green path continues.
- `Ask`: yellow path moves to phone.
- `Block`: red path stops.

### Scene D: Control Panel

Show compact policy controls:

- Agent: `Research Agent`
- Mode: `Ask every time / Allow under limits`
- Per action cap: `0.01 SOL`
- Daily cap: `0.05 SOL`
- Protocols: `helius, birdeye`
- Network: `Solana devnet`

### Scene E: Real App Inserts

Use phone-shaped frame. Place real screen recording inside. If no recording is
available, use a static recreation matching the app, but label the technical
proof separately with real devnet receipt and APK.

### Scene F: Receipt Proof

Show a compact proof chain:

`Action manifest hash -> Mobile approval -> Wallet signature -> Solana receipt`

Do not show long hashes at full length. Use short fragments and a small Explorer
icon.
