# Prompt: HTML Video Agent

You are creating an animated HTML presentation for SkillGuard.

SkillGuard gives AI agents wallet access without giving up control. It is a
wallet firewall for AI agents operating onchain: agents request wallet actions,
but the wallet owner controls what is allowed automatically, what requires
consent, what is blocked before signing, and what can be revoked.

Read these files first:

- `demo-package/MASTER_BRIEF.md`
- `demo-package/08-director-prompt.md`
- `demo-package/00-video-brief.md`
- `demo-package/01-voiceover-script.md`
- `demo-package/02-shot-list.md`
- `demo-package/03-visual-storyboard.md`
- `demo-package/05-html-presentation-spec.md`
- `demo-package/06-assets-map.md`
- `demo-package/references/style-and-components.md`
- `demo-package/references/site-home-reference.md`

Build a screen-recordable animated HTML presentation.

Hard requirements:

- Do not place the full voiceover on screen.
- Use short micro-copy only.
- Use picture-in-picture slots for optional real app recordings.
- Keep total runtime under 3 minutes.
- Use the SkillGuard visual style from the existing site.
- Use the included screenshots as concrete visual references:
  - `demo-package/assets/site-home-desktop.png`
  - `demo-package/assets/site-demo-desktop.png`
  - `demo-package/assets/site-home-mobile.png`
- Show the Allow, Ask, Block, and Revoke model.
- Show low-risk zero-spend auto-approval without implying auto-signing.
- Show the `0.001 SOL` paid request and Solana devnet receipt proof.
- Make the first 10 seconds about the wallet-risk problem, not architecture.
- The live proof spine is pair, auto-allow zero-spend, approve spend, block, revoke.
- If a request spends SOL, route it to explicit mobile wallet approval.
- Do not waste time on full API lists, long code snippets, generic AI hype, or generic Solana education.

Suggested final line on screen:

`Agents can act. Users stay in control.`
