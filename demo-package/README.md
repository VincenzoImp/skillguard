# SkillGuard Demo Package

This folder is a complete handoff for an AI video/presentation agent that knows
nothing about the project.

Goal: produce a polished under-3-minute hackathon video using an animated HTML
presentation plus optional picture-in-picture recordings from the real Android
app. The voiceover is recorded separately and synced later.

Core positioning:

> SkillGuard is a wallet firewall for AI agents operating onchain.

Core promise:

> Give AI agents wallet access without giving up control.

Do not present SkillGuard as only a policy API, demo app, or generic wallet. It
is the missing control layer between AI agents that want to operate onchain and a
user wallet holding real funds. The video must make the judge feel the bad
tradeoff first: hand an agent a signer, fund a throwaway wallet, or approve every
transaction manually. SkillGuard is the fourth path.

## Files

- `00-video-brief.md`: executive brief and success criteria.
- `01-voiceover-script.md`: timed narration script.
- `02-shot-list.md`: exact scenes, visuals, and screen references.
- `03-visual-storyboard.md`: slide-by-slide HTML presentation plan.
- `04-app-recording-guide.md`: how to capture real mobile inserts.
- `05-html-presentation-spec.md`: build requirements for the animated HTML.
- `06-assets-map.md`: where to find logos, QR, app, and proof assets.
- `07-final-export-checklist.md`: final QA checklist before submission.
- `08-director-prompt.md`: single best prompt and creative brief for the video agent.
- `prompts/html-video-agent-prompt.md`: prompt for the HTML video agent.
- `prompts/app-capture-agent-prompt.md`: prompt for an agent capturing app clips.
- `references/product-context.md`: product explanation for an external agent.
- `references/technical-proof.md`: concrete proof that the demo is real.
- `references/demo-flow.md`: operational flow and expected demo outcomes.

## Hard Rules

- Do not put the full voiceover on screen.
- Use short micro-copy only.
- Treat app recordings as proof inserts, not as the whole video.
- Keep the total video under 3 minutes.
- The story must explain the user struggle before showing the product.
- The first 10 seconds must make the wallet-risk problem obvious.
- The live demo spine is: pair, approve, block, revoke.
