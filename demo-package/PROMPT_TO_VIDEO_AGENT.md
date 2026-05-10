# Prompt To Pass To The Video Agent

Copy and paste the prompt below into the video/presentation agent. It assumes all
demo files have been imported, even if the import flattened the folder
structure.

```text
You are creating the final under-3-minute hackathon demo video for SkillGuard.

I have imported all SkillGuard demo files for you. The files may not preserve
their original folder structure, so do not rely on nested paths. Start by finding
and reading this file:

`00_FLAT_VIDEO_AGENT_HANDOFF.md`

That is the complete self-contained brief. It contains the product context,
voiceover timing, story, visual system, component references, phone screens,
motion rules, and honesty boundaries.

Also look for and use these visual reference files by filename:

- `site-home-desktop.png`
- `site-demo-desktop.png`
- `site-home-mobile.png`

These screenshots are the concrete reference for the actual SkillGuard site and
phone mock style. Match them closely: dark wallet-grade UI, compact cards,
phone-shaped app frame, mint/amber/red/violet/blue status language, and serious
product feel. Do not invent a new visual style.

Your deliverable:

- A polished animated HTML presentation or small Vite app.
- It must be screen-recordable at 1920 x 1080.
- Final runtime must stay under 3 minutes.
- No audio track.
- No generated voiceover.
- No full-script subtitles.
- Use only short on-screen micro-copy.
- The voiceover will be recorded separately and synced later.

Core message:

SkillGuard is the wallet firewall for AI agents operating onchain. It lets
agents request wallet actions without receiving the user's private key. The
wallet owner defines policy, approves sensitive actions, blocks unsafe actions,
and can revoke an agent at any time.

The first 10 seconds must make the problem obvious:

- Useful AI agents need wallet access to act onchain.
- Wallet access means real fund risk.
- Direct signer access is dangerous.

Do not start with code, API routes, generic AI hype, generic Solana education, or
a generic landing page.

Required story sequence:

1. Hook: useful AI agents need wallet access, but wallet access means real fund risk.
2. Bad tradeoff: personal wallet, funded burner wallet, or manual approval for everything.
3. Solution: SkillGuard sits between agent intent and wallet signatures.
4. Product model: Allow, Ask, Block, Revoke.
5. Demo proof:
   - pair Research Agent by QR;
   - show a low-risk `0 SOL` wallet scan auto-approved under `Allow under limits`;
   - show a `0.001 SOL` paid report requiring explicit mobile wallet approval;
   - show a `0.05 SOL` request blocked before signing;
   - show the agent being revoked.
6. Technical proof: Android app, Mobile Wallet Adapter, Vercel API, Research Agent, Anchor program, Solana devnet receipt.
7. Close: Agents can act. Users stay in control.

Critical honesty boundary:

Do not say or imply that SkillGuard auto-signs spending transactions. In the
MVP, auto-approval only applies to low-risk zero-spend requests. Any action that
spends SOL, references a raw transaction, or has higher risk must go through
explicit mobile wallet approval.

Use this key line in the story:

`Low-risk work can proceed automatically. The moment money moves, the owner is back in the loop.`

Use these on-screen micro-copy lines where useful:

- `Useful agents need wallet access`
- `Direct signer access puts funds at risk`
- `Wallet firewall for AI agents`
- `Allow / Ask / Block / Revoke`
- `Low-risk work can auto-approve`
- `Spending requires consent`
- `Blocked before signing`
- `Recorded on Solana devnet`
- `Agents can act. Users stay in control.`

Required visual components:

1. Agent node
   - Label: `Research Agent`
   - Status examples: `Signed manifest`, `Waiting for policy`

2. Wallet node
   - Label: `Owner wallet`
   - Badge: `Solana devnet`
   - Message: `Funds stay protected`

3. SkillGuard firewall
   - Central visual between agent and wallet.
   - It splits requests into `Allow`, `Ask`, `Block`, and `Revoke`.

4. Phone frame
   - Tall phone-shaped frame, not desktop mock.
   - Match the style from `site-home-desktop.png`.
   - Screens/tabs: `Home`, `Inbox`, `Agents`, `Pair`, `Activity`.

5. Policy card
   - `Agent: Research Agent`
   - `Mode: Allow under limits / Ask every time`
   - `Max per action: 0.01 SOL`
   - `Daily cap: 0.05 SOL`
   - `Network: Solana devnet`
   - `Protocols: Helius, Birdeye`
   - Boundary copy: `Auto-approval only applies to low-risk zero-spend requests. Spending still needs wallet approval.`

6. Action cards
   - `Scan wallet for risky token approvals` / `0 SOL` / `Auto-approved by policy` / `No wallet signature needed`
   - `Generate weekly wallet risk PDF` / `0.001 SOL` / `Requires approval` / `Wallet signs after owner approval`
   - `Subscribe to real-time risk alerts` / `0.05 SOL` / `Blocked` / `Exceeds 0.01 SOL max`

7. Technical proof grid
   - `Android APK`
   - `Mobile Wallet Adapter`
   - `Vercel API`
   - `Research Agent`
   - `Anchor receipt program`
   - `Solana devnet`

Motion requirements:

- Request lines move from Research Agent to SkillGuard.
- Allowed zero-spend request passes in mint.
- Spending request routes to phone approval in amber.
- Blocked request stops at firewall in red.
- Revoke disables future request lines in violet.
- Receipt proof appears only after wallet approval.

Use real app recordings only as short picture-in-picture proof inserts. Do not
turn the whole video into a raw phone walkthrough. If real app clips are not
available, create accurate phone-frame recreations using the visual references.

Produce the final animated HTML presentation now.
```
