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

The first 10 seconds must be immediately understandable with no narration:

- agent wants to act
- wallet contains funds
- direct signer access is the danger

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
- `Revoke`: violet kill switch disables future requests.

### Scene D: Control Panel

Show compact policy controls:

- Agent: `Research Agent`
- Mode: `Ask every time / Allow under limits`
- Per action cap: `0.01 SOL`
- Daily cap: `0.05 SOL`
- Protocols: `helius, birdeye`
- Network: `Solana devnet`

Keep this section short. The audience does not need every field explained; they
need to understand that the policy belongs to the wallet owner and applies per
agent.

### Scene E: Real App Inserts

Use phone-shaped frame. Place real screen recording inside. If no recording is
available, use a static recreation matching the app, but label the technical
proof separately with real devnet receipt and APK.

The real app inserts should show only high-signal moments:

1. QR pairing imports Research Agent.
2. Inbox asks for `0.001 SOL`.
3. Overspend is blocked before signing.
4. Agent is revoked.

### Scene F: Receipt Proof

Show a compact proof chain:

`Action manifest hash -> Mobile approval -> Wallet signature -> Solana receipt`

Do not show long hashes at full length. Use short fragments and a small Explorer
icon.

### Scene G: Close

Return to the agent, wallet, and SkillGuard firewall. The agent continues
working, but requests still pass through policy. End on:

`Agents can act. Users stay in control.`
