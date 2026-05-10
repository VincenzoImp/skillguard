# SkillGuard Video Agent Prompt

Copy this file into the video/presentation agent prompt, together with the
other files in this flat bundle. The bundle is intentionally under 12 files and
does not depend on folder structure.

## Prompt

You are creating the final under-3-minute hackathon demo video for SkillGuard.

I imported a compact flat bundle for you. Do not rely on nested folders. Read
all markdown files by filename and use the screenshots by filename.

Expected files:

- `00_READ_THIS_FIRST_PROMPT.md`
- `01_STORY_SCRIPT_AND_SHOTS.md`
- `02_VISUAL_COMPONENTS_AND_TECH_PROOF.md`
- `site-home-desktop.png`
- `site-demo-desktop.png`
- `site-home-mobile.png`

Your deliverable is a polished animated HTML presentation or small Vite app
that can be screen-recorded at 1920 x 1080.

Hard requirements:

- Runtime under 3 minutes.
- No audio track.
- No generated voiceover.
- No full-script subtitles.
- Use only short on-screen micro-copy.
- The voiceover will be recorded separately and synced later.
- Use the included screenshots as the concrete visual source of truth.
- Match SkillGuard's real site and app style: dark wallet-grade UI, compact
  cards, a tall phone frame, mint/amber/red/violet/blue status language, and a
  serious product feel.
- Do not create a generic SaaS landing page, generic AI visuals, stock visuals,
  decorative blobs, or a different design system.

Core message:

SkillGuard is the wallet firewall for AI agents operating onchain. It lets
agents request wallet actions without receiving the user's private key. The
wallet owner defines policy, approves sensitive actions, blocks unsafe actions,
and can revoke an agent at any time.

The first 10 seconds must make the problem obvious:

- Useful AI agents need wallet access to act onchain.
- Wallet access means real fund risk.
- Direct signer access is dangerous.

Required story sequence:

1. Hook: useful AI agents need wallet access, but wallet access means fund risk.
2. Bad tradeoff: personal wallet, funded burner wallet, or manual approval for
   everything.
3. Solution: SkillGuard sits between agent intent and wallet signatures.
4. Product model: Allow, Ask, Block, Revoke.
5. Demo proof:
   - pair Research Agent by QR;
   - show a low-risk `0 SOL` wallet scan auto-approved under `Allow under limits`;
   - show a `0.001 SOL` paid report requiring explicit mobile wallet approval;
   - show a `0.05 SOL` request blocked before signing;
   - show the agent being revoked.
6. Technical proof: Android app, Mobile Wallet Adapter, Vercel API, Research
   Agent, Anchor program, Solana devnet receipt.
7. Close: Agents can act. Users stay in control.

Critical honesty boundary:

Do not say or imply that SkillGuard auto-signs spending transactions. In the
MVP, auto-approval only applies to low-risk zero-spend requests. Any action that
spends SOL, references a raw transaction, or has higher risk must go through
explicit mobile wallet approval.

Use this line in the story:

```text
Low-risk work can proceed automatically. The moment money moves, the owner is back in the loop.
```

Required visual components:

- Agent node: `Research Agent`, `Signed manifest`, `Waiting for policy`.
- Wallet node: `Owner wallet`, `Solana devnet`, `Funds stay protected`.
- Central SkillGuard firewall with lanes: `Allow`, `Ask`, `Block`, `Revoke`.
- Tall phone frame with tabs: `Home`, `Inbox`, `Agents`, `Pair`, `Activity`.
- Policy card for Research Agent with spend limits and devnet scope.
- Three action cards:
  - `Scan wallet for risky token approvals` / `0 SOL` / `Auto-approved by policy`.
  - `Generate weekly wallet risk PDF` / `0.001 SOL` / `Requires approval`.
  - `Subscribe to real-time risk alerts` / `0.05 SOL` / `Blocked`.
- Technical proof grid: `Android APK`, `Mobile Wallet Adapter`, `Vercel API`,
  `Research Agent`, `Anchor receipt program`, `Solana devnet`.

Motion requirements:

- Request lines move from Research Agent to SkillGuard.
- Allowed zero-spend request passes in mint.
- Spending request routes to phone approval in amber.
- Blocked request stops at the firewall in red.
- Revoke disables future request lines in violet.
- Receipt proof appears only after wallet approval.

Use real app recordings only as short picture-in-picture proof inserts. If real
app clips are not available, create accurate phone-frame recreations using the
included visual references.

Produce the final animated HTML presentation now.
