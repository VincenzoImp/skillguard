# SkillGuard Story Demo

This folder is the committed static animated story for the three-minute
SkillGuard video. It replaces the temporary video-agent handoff bundle.

Open it from the public site build at:

```text
/demo/story/index.html
```

For a local static server from the repository root:

```bash
npm --prefix apps/site run dev -- --host 0.0.0.0
```

Then open:

```text
http://localhost:5173/demo/story/index.html
```

## Files

- `index.html`: executable browser story.
- `animations.jsx`: timing, playback, and stage helpers.
- `ui.jsx`: cards, badges, QR, phone-safe visual primitives.
- `nodes.jsx`: agent, wallet, policy, request, and flow nodes.
- `phone.jsx`: reconstructed SkillGuard mobile screens.
- `scenes.jsx`: the full three-minute story sequence.
- `SCRIPT.md`: voiceover, timing, shot list, and product boundary.
- `VOICEOVER_ELEVENLABS.txt`: clean plain-text input for ElevenLabs.

## Production Notes

The recorded voiceover should be produced separately. Do not render the full
voiceover as subtitles in the animation. Keep only short on-screen micro-copy.
Use `VOICEOVER_ELEVENLABS.txt` as the direct ElevenLabs input; it intentionally
has no markdown headings, no timecodes, and no visual directions.

The core product boundary must stay explicit:

```text
Low-risk work can proceed automatically. The moment money moves, the owner is back in the loop.
```

Auto-approval is intentionally limited to low-risk zero-spend manifest work.
Spending requests still require explicit wallet approval.
