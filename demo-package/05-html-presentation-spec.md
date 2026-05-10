# HTML Presentation Spec

## Output

Create a single self-contained HTML presentation or small Vite app that can be
screen-recorded at 1920x1080. It should be animated but not cluttered.

## Timing

Total runtime target: 2:45. Hard max: 3:00.

Use these scenes:

1. Hook: 12s
2. Struggle: 22s
3. Product reveal: 39s
4. How it works: 19s
5. App proof inserts: 55s
6. Technical proof: 20s
7. Closing: 10s

## On-Screen Text Rule

Do not place the full voiceover on screen. Use micro-copy only:

- `AI agents can act onchain`
- `Wallet access means real funds`
- `Allow / Ask / Block / Revoke`
- `Wallet access without giving up control`
- `Low-risk work can auto-approve`
- `Spending requires consent`
- `Blocked before signing`
- `No automatic wallet signing for spend`
- `Recorded on Solana devnet`
- `Agents can act. Users stay in control.`

## Required Components

- Agent node
- Wallet node
- SkillGuard firewall block
- Allow/Ask/Block lanes
- Policy card
- Phone frame for picture-in-picture app clips
- Technical proof grid
- Final tagline
- Phone-like app screen recreations matching the actual mobile UI if live clips
  are unavailable

## Narrative Priority

The video must optimize for comprehension over visual density. A judge should
understand these points even with the audio muted:

1. Agents need wallet access to be useful.
2. Raw wallet access is unsafe.
3. SkillGuard is the firewall between agent and wallet.
4. The app proves pair, auto-allow zero-spend, approve spend, block, and revoke.
5. The technical proof is real: Android, MWA, Vercel API, Research Agent, Solana devnet.

## Animation Guidance

- Request lines should move from agent to firewall.
- Allowed zero-spend request continues as policy-approved without wallet signing.
- Ask request moves to mobile approval.
- Blocked request stops at firewall.
- Receipt proof appears after approval.

Use restrained motion. Prioritize clarity over spectacle.

Do not waste time on long code snippets, full API route lists, generic Solana
education, or decorative hero animations that do not advance the story.

Do not state or visualize automatic signing for a spending transaction. If a
request spends SOL, it must route to the mobile wallet approval path.
