# Mobile App Redesign

Date: May 9, 2026

## Goal

Move the Android app from a single long approval surface to a navigable approval
center. The product must make three states obvious:

- a fresh wallet has no connected agents
- only owner-paired agents can submit requests
- approvals, rejections, blocks, and revocations are separate user decisions

## Information Architecture

The app uses five persistent tabs:

- `Home`: wallet session status, live API badges, counters, connect, disconnect,
  refresh, and primary shortcuts
- `Inbox`: pending action detail, with only other pending requests shown in a
  compact queue so the selected request is not duplicated
- `Agents`: active agent inventory, revoke action, and per-agent policy mode
  editing; revoked connections disappear from the active inventory
- `Pair`: default QR scanner, pairing-link fallback, public key, purpose,
  limits, protocols, and mints
- `Activity`: completed, blocked, rejected, and expired decisions plus Explorer
  links when signatures exist

This keeps the wallet approval workflow dense but not crowded. Each tab maps to
one user job instead of making the user scroll through every control.

## Interaction Rules

- `Home` is the cold-start tab for disconnected wallets.
- After wallet connection, the app routes to `Pair` when no agents exist.
- If pending requests exist, the app routes to `Inbox`.
- Approving or rejecting a request routes to `Activity` after the API state
  refreshes.
- Importing or revoking an agent routes to `Agents`.
- Pending requests are not counted in `Activity`; that badge only counts final
  decisions.
- Expired open manifests are shown as expired decisions, not as actionable
  pending requests, and are not counted as user history unless the API recorded
  an explicit expired decision.
- Revocation cleanup can cause old expired requests to evaluate as blocked;
  those stale cleanup outcomes are not counted as user decision history.
- Permission controls are scoped to the specific active agent shown on each
  policy card.
- QR pairing only fills agent identity fields; pairing still requires a
  wallet-owner sign-message proof before the API creates a connection.
- Wallet-specific reads require a wallet session token created by sign-message.

## Empty States

Empty states are real product states, not demo placeholders:

- no wallet connected
- wallet connected with zero agents
- agent paired but zero requests
- no selected request
- no completed decisions

They avoid seeded data and point the user to the next real action.

## Visual System

The mobile app keeps the SkillGuard dark security console direction:

- dark navy background with restrained mint, warning, danger, and info tones
- compact cards with 8-12px radii
- uppercase micro labels for machine-readable state
- fixed bottom navigation for thumb reach
- dense metrics instead of marketing copy

## Verification

The navigation model is covered by `apps/mobile/src/appNavigation.test.ts`.
Inbox and permission presentation rules are covered by
`apps/mobile/src/inboxPresentation.test.ts` and
`apps/mobile/src/permissionPresentation.test.ts`.
Mobile verification commands:

```bash
npm --prefix apps/mobile test
npm --prefix apps/mobile run typecheck
npm --prefix apps/mobile run doctor
```

The final APK must be rebuilt after any mobile UI change:

```bash
scripts/build-mobile-apk.sh
```
