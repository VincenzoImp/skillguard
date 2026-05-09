# SkillGuard Best Ending Plan

Date: 2026-05-09
Status: Executed through implementable repo changes; video recording and hackathon form submission remain human-owned external steps.
Supersedes: `2026-05-09-research-agent-demo-loop-design.md` (its loop section is folded into Phase 1 of this plan).

## Goal

Take SkillGuard from "MVP that runs locally" to "hackathon submission that actually sells". Two focused phases: a demo that proves real value end-to-end, and a presentation surface that convinces a judge in 30 seconds.

## Constraints

- Quality bar: every feature ships with tests, runs end-to-end on a real Android device, and is documented. No half-implemented paths.
- Solana track is the prize target (`Best App Overall on Solana`, $10k pool, Ledger top-10 / Claude Pro top-30 add-ons).
- Solana Mobile dApp Store: skipped (KYC + 3-5 day review window cannot be compressed).
- LI.FI / ElevenLabs / Virtuals: skipped (no integration code, dilutes focused pitch).
- All on-chain activity stays on devnet.
- No new Anchor program instructions, no token delegation module.

## Quality bar

Concrete standards every change in this plan must meet before being marked done:

- New TS code has unit tests (vitest) covering happy path, the most likely failure, and one edge case.
- Mobile changes are tested on a real Android device, not only emulator.
- API changes have an integration test against a local instance.
- All new env vars are documented in `.env.example` and `docs/VERCEL.md`.
- Demo flow runs end-to-end without manual recovery. If it ever asks the operator to "just retry", that's a defect.
- README.md, docs/DEMO.md, docs/SUBMISSION.md stay in sync with what the code actually does.
- Pre-commit hook stays green; no `--no-verify` shortcuts.

## Non-goals

- Real custody. SkillGuard does not move tokens without an explicit user signature.
- Multi-agent ecosystem. One agent (`agent-research`), one wallet, one device. Pitch the standard, demo a vertical slice.
- iOS, web wallet, or Phantom-mobile fallback. Android + MWA only.
- QR-code pairing. Deep-link paste is enough for the demo; QR is a future polish.

---

## Phase 1 — Demo that sells

Goal: when a judge watches the video, every claim in the pitch is shown happening on-chain in front of them.

### 1.1 Bundle real transfer + receipt in one signed transaction

Today the approval transaction signs only `record_decision`. The user's wallet balance does not change; the manifest's "spend" field is metadata. This is the single biggest credibility gap.

Fix: the approval transaction becomes atomic `[transferIx, recordDecisionIx]`. One MWA signature, both effects on devnet. The mobile app builds it; the Anchor program is unchanged.

Concrete changes:

- `apps/mobile/src/screens/WalletConnectScreen.tsx`: when the manifest declares a non-zero spend, prepend a `SystemProgram.transfer` instruction to the approval transaction.
- The transfer destination is a fixed devnet treasury wallet address, declared as a constant `RESEARCH_TREASURY_ADDRESS`. We generate it once and commit only the public address.
- Spend currency: SOL on devnet, not USDC. Reasoning: USDC on devnet requires mint setup, ATA creation, and a flaky faucet for zero demo benefit. SOL transfers work out of the box.
- Manifest fields updated to reflect SOL: `mint: "SOL"`, `amountAtomic` in lamports, `human` in SOL.

Acceptance: when the user approves Action 2 in the app, Solscan shows the user's wallet balance drop by 0.001 SOL and the SkillGuard receipt PDA created, both in the same transaction signature.

### 1.2 Autonomous research-agent loop

Replace the manual `npm run submit:safe/unsafe/revoked` demo flow with an autonomous loop daemon. Agent connects once, runs continuously, sends actions on a deterministic schedule that respects user decisions.

Concrete changes (folded from the prior loop spec):

- `apps/research-agent/src/loop.ts` (new): state machine, `runLoop(deps)` pure function.
- `apps/research-agent/src/loopEntry.ts` (new): thin wrapper that wires real client + log + sleep, called by `npm run agent:loop`.
- `apps/research-agent/src/loopLog.ts` (new): formatting helpers, emoji default, `SKILLGUARD_LOOP_QUIET=1` for tests.
- `apps/research-agent/src/actions.ts` (edit): three Wallet Risk Monitor manifest builders (free scan, paid report, subscription upgrade).
- `apps/research-agent/src/client.ts` (edit): `waitForDecision(actionId, { pollMs, timeoutMs })`.
- `apps/research-agent/src/index.ts` (keep): existing CLI commands stay for smoke tests.
- Tests: `loop.test.ts`, `loopLog.test.ts`, extended `actions.test.ts`.

Three actions in the loop sequence:

1. **Free Wallet Scan** — read-only, 0 lamports spend, expected approved.
2. **Paid Risk Report** — 1_000_000 lamports (0.001 SOL) transfer to research treasury, expected approved when user policy `maxSpendAtomic >= 1_000_000`.
3. **Subscription Upgrade** — 50_000_000 lamports (0.05 SOL) transfer, expected blocked by policy engine before mobile prompt.

Loop behavior: sequential, await each decision, restart on cycle complete, exit on revoke. `SIGINT` exits cleanly.

Acceptance: `npm --prefix apps/research-agent run agent:loop` runs end-to-end against the hosted API, mobile app receives actions, decisions flow back, the loop continues or exits as designed.

### 1.3 Push notifications on new pending action

Today the mobile app discovers new actions only when in the foreground via `liveApi` polling. For a real demo and for product credibility, the user should get a push when the agent submits a new action while the phone is locked or the app is backgrounded.

Stack choice: **Expo Notifications** + Expo Push API. Justification:

- The app is already Expo-based (`expo: ^55`, `expo-dev-client` present in `apps/mobile/package.json`).
- Expo Push wraps FCM transparently. No Firebase project setup, no `google-services.json` ceremony, just an Expo push token per device.
- Backend just calls `https://exp.host/--/api/v2/push/send` with `{ to: token, title, body, data }`.
- Migration path to FCM later is straightforward if needed.

Concrete changes:

- `apps/mobile/package.json`: add `expo-notifications`, `expo-device`.
- `apps/mobile/src/notifications/` (new folder):
  - `registerPushToken.ts`: request permission, get Expo push token, return it.
  - `handleNotificationTap.ts`: when the user taps a notification, navigate the app to the inbox with that action selected.
- `apps/mobile/App.tsx`: on wallet connect, register for notifications and `POST /api/wallets/:wallet/push-token` (signed with the wallet's session token, same auth as other wallet-owner endpoints).
- `apps/api/src/`:
  - New endpoint `POST /api/wallets/:wallet/push-token` — stores `{ wallet -> [pushTokens] }` in KV. Wallet session auth required.
  - New endpoint `DELETE /api/wallets/:wallet/push-token` — removes a token (for logout / device migration).
  - In the existing `POST /api/actions` handler, after successfully storing the action, fan out a push to all tokens registered for that wallet. Title: agent display name. Body: action title. Data: `{ actionId, kind: "new_action" }`.
  - New module `apps/api/src/push.ts`: small wrapper around the Expo Push HTTP API with retry on 429, dropping invalid tokens (`DeviceNotRegistered` response).
- Tests:
  - `apps/api/src/push.test.ts`: mocked Expo Push response, verify retry, verify token cleanup on `DeviceNotRegistered`.
  - `apps/mobile/src/notifications/registerPushToken.test.ts`: mock `expo-notifications`, assert correct permission flow.
- `.env.example`: add `EXPO_ACCESS_TOKEN` (optional, for push receipt verification — skip on first cut).
- Storage: KV namespace `pushTokens:<wallet>` returning a JSON array of tokens. Idempotent on re-registration.

Edge cases handled:

- Same wallet on two devices: both tokens stored, both receive the push.
- Permission denied by user: app continues to work via polling, no error toast spam.
- Expo Push returns "DeviceNotRegistered": backend deletes the dead token.
- Hosted API in memory mode (no KV): push registration silently no-ops with a warning log; polling still works.

Acceptance: agent submits an action while the phone is locked, the device shows a push notification with agent name + action title, tapping the notification opens the app to the inbox with the action selected.

### 1.4 Video demo (under 2 minutes, scripted)

The video is the artifact judges actually watch. It must be short, sharp, and let the agent loop and push notifications do most of the talking.

Script structure (target 110s, hard cap 180s):

| Beat | Duration | Visual | Voice |
|---|---|---|---|
| Hook | 8s | Site hero | "AI agents are about to ask your wallet for a lot. Today there's no permission layer between them and your funds." |
| Pair agent | 12s | Mobile: paste pairing link, sign challenge, set policy | "I import a Research Agent, sign the wallet challenge, and configure: max 0.01 SOL per action, allowed mints SOL, allowed protocols Helius and Birdeye." |
| Lock screen + push | 10s | Phone screen locks, push notification arrives, swipe to open | "I lock my phone. The agent submits a request. SkillGuard pushes me a notification — same flow as a banking app." |
| Action 1 approve | 12s | Mobile inbox, approve, show receipt + Solscan | "Read-only wallet scan, zero spend. I approve, the decision is recorded on devnet." |
| Action 2 approve | 18s | Push arrives, open, approve, show balance drop + receipt on Solscan | "Paid risk report — 0.001 SOL fee. I approve. SkillGuard signs ONE transaction that both transfers the fee AND records the receipt. Atomic." |
| Action 3 blocked | 12s | Mobile, blocked badge, no approval prompt | "Now it tries a 0.05 SOL subscription. The policy engine blocks it before SkillGuard ever asks me to sign. The agent never had a chance to overspend." |
| Revoke | 12s | Mobile revoke, agent terminal exits | "I revoke the agent. Next request fails policy, the agent receives the revoked status, and shuts down cleanly." |
| Closing | 16s | Site architecture page | "SkillGuard is the firewall between AI agents and your Solana wallet. SDK in 5 lines. Push notifications, policy engine, atomic execution + audit, on-chain proof. Roadmap: limited delegation for recurring approved actions." |

Recording approach: real Android device screen recording for mobile (using Android Studio's `screenrecord` or `scrcpy --record`), terminal recording for the agent loop. Edit in DaVinci Resolve or iMovie with simple cuts; no music, no transitions. Voice over recorded separately and aligned in post.

Acceptance: under-3-minute MP4, hosted on YouTube unlisted, linked from `docs/SUBMISSION.md`, the README, and `apps/site`.

### 1.5 Demo script doc update

Rewrite `docs/DEMO.md` to match the video script: exact commands, exact taps, expected outputs. This is what the judge or anyone replicating the demo follows.

---

## Phase 2 — Presentation that convinces

Goal: when a judge clicks the site link, they see a product, not a side project.

### 2.1 Remove legacy static-site workflow, Vercel-only

The repo previously had a static-site-only deploy path in addition to Vercel. The Vercel domain is the production canonical surface and hosts the API; the duplicate deploy path is redundant and confuses the proof set.

Concrete changes:

- Delete the obsolete static-site workflow under `.github/workflows/`.
- `apps/site/vite.config.ts`: drop the `/skillguard/` base path, default to `/`.
- `apps/site/vite.config.test.ts` and `vercel-config.test.ts`: update base-path expectations.
- `vercel.json`: drop the root-base environment override (no longer needed) and add SPA rewrite for client-side routing: `{ "rewrites": [{ "source": "/((?!api/).*)", "destination": "/" }] }`.
- Strip references to the old static-site URL from `README.md`, `docs/SUBMISSION.md`, `docs/ROADMAP.md`, `docs/PRODUCT.md`, `docs/VERCEL.md`, `scripts/precommit-check.sh`, `scripts/submission-check.sh`, `apps/site/src/submissionStatus.ts`.

### 2.2 Multi-page site on Vercel

Today the site is one long scrolling page. Add `react-router-dom` and split into named routes. The header navigation becomes meaningful instead of in-page anchors.

Page layout:

| Route | Sections from current `App.tsx` |
|---|---|
| `/` (Home) | Hero + ProofStrip + Problem + Solution + CTA to /demo and /developers |
| `/demo` | DemoSection + interactive PhoneDemo |
| `/architecture` | ArchitectureSection + SecuritySection |
| `/developers` | DeveloperSection + LiveApiSection (SDK + endpoint table) |
| `/about` | BrandSystemSection + RoadmapSection + ResourceSection |

Refactor approach:

- Add `react-router-dom` to `apps/site/package.json`.
- Extract each section into `apps/site/src/pages/<Name>.tsx`.
- Extract shared chrome into `apps/site/src/components/Header.tsx` and `Footer.tsx`.
- Create `apps/site/src/main.tsx` with `<BrowserRouter>` + route definitions.
- Header `<Link>` highlights active route.

Acceptance: deep linking works (e.g. `/developers` loads directly), nav highlights current page, no console errors, build passes, deploy preview on Vercel renders all routes.

### 2.3 Sharper copy with "firewall" framing

The current hero copy uses "permission layer" language, which is technically correct but soft. Replace with a sharper pitch.

Hero (new):
- Title: **"The firewall between AI agents and your Solana wallet."**
- Subhead: "Agents ask. Policies filter. You approve. Solana records the proof."
- Primary CTA: "Watch 90s demo"
- Secondary CTA: "Integrate an agent"

Problem section: replace abstract phrasing with the concrete tension:
> "AI agents are about to need wallet access at scale. Two existing options are bad: give them your private key, or sign every micro-transaction yourself. SkillGuard is the third way."

Architecture page: keep technical depth but lead with the one-line claim.

### 2.4 README final pass

- Replace mixed proof URLs (Vercel + GH Pages) with Vercel-only.
- Promote the agent loop command (`npm --prefix apps/research-agent run agent:loop`) to the primary demo path; keep the per-action submit commands as "manual mode".
- Status section: move "Submission blockers" inside `docs/SUBMISSION.md`, leave only "Submission proofs" in README.
- Add a "Pitch" callout at the top: one-line firewall framing.

### 2.5 Submission package finalisation

- `docs/SUBMISSION.md`: update with video URL when recorded, mark Solana Mobile dApp Store as "explicitly out of scope" with a one-line rationale.
- Hackathon submission form: fill with repo URL, Vercel site URL, video URL, program ID, devnet receipt signature. Apply also to Colosseum Accelerator (separate, free, takes 10 minutes).

---

## Sequencing

Strict order of operations, optimised so each step ends in a runnable demo. Push notifications come early because they affect the demo flow more than copy does.

1. **Phase 1.1** (real transfer + receipt bundle) — foundational, everything assumes it.
2. **Phase 1.2** (loop daemon) — depends on 1.1 because manifests now carry real SOL spend.
3. **First end-to-end smoke** — run the loop against hosted API, complete one full cycle from the operator's wallet, fix anything that breaks.
4. **Phase 1.3** (push notifications) — adds the "feels like a real app" beat. Test on real Android device.
5. **Second end-to-end smoke** — full demo path with notifications, on real device, end to end.
6. **Phase 2.1** (kill GH Pages) — quick win, unblocks 2.2.
7. **Phase 2.2** (multi-page site) — refactor in one focused session.
8. **Phase 2.3** (sharper copy) — once routes exist, drop the new firewall framing in.
9. **Phase 2.4** (README pass) — sync with new state of the world.
10. **Phase 1.5** (demo script doc) — write commands + taps to match the stable demo.
11. **Phase 1.4** (record video) — record only after everything else is stable; re-recording is expensive.
12. **Phase 2.5** (submission package) — fill out the hackathon form, apply to Colosseum.

Why notifications before video: the lock-screen push beat is one of the most compelling moments in the script. Without it, the script changes.

Why video late: re-recording is the most expensive thing in this plan. Lock the demo state, lock the copy, then film once.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| MWA signing of bundled tx fails on real device | Test on emulator first, then real device. If real device flakes, fall back to single-tx mode for demo and ship bundled mode behind a flag. |
| Agent loop deadlocks waiting for a decision | Built-in 5-minute timeout per action. Loop continues to next action on timeout, never blocks. |
| Devnet faucet rate limit blocks topping up wallet | Operator funds wallet via web faucet (faucet.solana.com or QuickNode) before recording. CLI airdrop is rate-limited. |
| Multi-page refactor breaks Vercel build | Test build locally with `npm --prefix apps/site run build` before pushing. Keep PR small; can roll back to single-page if needed. |
| Push notifications don't deliver on real device | Expo Push has well-known reliability. Test on real device early. If pushes are unreliable, the demo still works via polling — push is additive, not a hard dependency. |
| Expo dev-client build is too large or slow | The push token works in standalone APK builds too. If dev-client gets in the way during testing, build a release APK and test there. |
| KV not configured on hosted API | Push tokens stored only in memory in that mode; degrade gracefully with a log. Document the upstash setup in `docs/VERCEL.md`. |
| Video over 3 minutes | Script targets 110s, hard cap 180s. Cut the closing beat or one approve beat if needed. Action 3 (blocked) and the push notification beats are non-negotiable. |

## Definition of done

The whole plan is done when:

- A judge clicks the Vercel link and lands on a multi-page product site with the firewall framing.
- They watch the under-2-minute video and see: agent paired, lock-screen push notification, real SOL moved, action blocked by policy, agent revoked.
- They click GitHub: README opens with Pitch + Submission proofs at the top.
- The hackathon submission form has all proof URLs filled in.
- Colosseum application is submitted.
- No legacy static-site link anywhere in the repo or active docs.
- The operator can install the APK on a fresh device, pair the agent, run the loop, receive pushes, approve/reject/revoke, all without consulting docs beyond `docs/DEMO.md`.

## Out of scope (deferred to future iterations)

- QR-code pairing
- Token delegation / limited authority module
- Multi-agent UI (agent list, multi-pairing)
- iOS app
- Solana Mobile dApp Store submission (revisit post-hackathon if Seeker phones become a goal)
- LI.FI route preview, x402 paid endpoint, Solana Agent Kit live integration

## Open questions

None. All trade-offs decided with the operator: Option B for transactions, Wallet Risk Monitor narrative, sequential loop with restart, multi-page Vercel-only site, sharper firewall framing, video last.
