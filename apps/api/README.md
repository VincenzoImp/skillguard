# SkillGuard API

Backend API for agent registration, connect links, action manifests, policy evaluation, and approval/rejection webhooks.

## Commands

```bash
npm install
npm test
npm run build
npm run dev
```

## MVP Endpoints

- `GET /health`
- `GET /agents`
- `POST /agents`
- `GET /agents/:agentId`
- `POST /connections`
- `GET /connections?wallet=...`
- `PATCH /connections/:connectionId/policy`
- `POST /connections/:connectionId/revoke`
- `DELETE /connections/:connectionId`
- `POST /actions`
- `GET /actions?wallet=...`
- `GET /actions/pending?wallet=...`
- `GET /actions/:actionId`
- `POST /actions/:actionId/evaluate`
- `POST /actions/:actionId/decision`

The local MVP uses an in-memory store. It still includes deterministic fixtures for
API tests and smoke checks, but the mobile app does not read seeded inbox state:
it queries by the connected wallet address and shows only actions submitted for
that wallet.

Approved decisions must include both:

- `signature`: devnet transaction signature returned by Mobile Wallet Adapter
- `receiptAddress`: SkillGuard `ActionReceipt` PDA recorded by the mobile app
