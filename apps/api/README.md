# SkillGuard API

Backend API for agent registration, wallet-owned connections, action manifests,
policy evaluation, mobile decisions, and smoke-run cleanup.

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
- `DELETE /smoke-runs/:runId?wallet=SmokeWallet...`

The local MVP uses an in-memory store and starts empty. Deterministic fixtures
exist only in tests and automated smoke helpers. Production storage is also
empty by default and sanitizes legacy demo or smoke artifacts on load. The
mobile app queries by the connected wallet address and shows only connections
and actions created for that wallet.

The API is intentionally public: external agents and apps can register an
agent, create a wallet-owned connection after the user imports/configures it in
the app, submit `ActionManifest` payloads, and poll for decisions. The API never
receives wallet private keys.

Approved decisions must include both:

- `signature`: devnet transaction signature returned by Mobile Wallet Adapter
- `receiptAddress`: SkillGuard `ActionReceipt` PDA recorded by the mobile app
