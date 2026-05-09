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
- `POST /agents` with immutable `publicKey`
- `GET /agents/:agentId`
- `POST /wallet-sessions` with wallet-owner proof
- `POST /connections` with `ownerProof`
- `GET /connections?wallet=...` with `x-skillguard-wallet-session`
- `PATCH /connections/:connectionId/policy` with wallet-owner proof
- `POST /connections/:connectionId/revoke` with wallet-owner proof
- `DELETE /connections/:connectionId` with wallet-owner proof
- `POST /actions` with `agentProof`
- `GET /actions?wallet=...` with `x-skillguard-wallet-session`
- `GET /actions/pending?wallet=...` with `x-skillguard-wallet-session`
- `GET /actions/:actionId`
- `POST /actions/:actionId/evaluate`
- `POST /actions/:actionId/decision` with wallet-owner proof
- `DELETE /smoke-runs/:runId?wallet=SmokeWallet...`

The local MVP uses an in-memory store and starts empty. Deterministic fixtures
exist only in tests and automated smoke helpers. Production storage is also
empty by default and sanitizes legacy demo or smoke artifacts on load. The
mobile app queries by the connected wallet address and shows only connections
and actions created for that wallet.

The API is intentionally public: external agents and apps can register an
agent, submit `ActionManifest` payloads, and poll for decisions. A new
wallet-owned connection requires `ownerProof`: a Solana sign-message proof over
the wallet, agent ID, connection ID, and exact policy fields. This prevents third
parties from connecting agents to wallets that did not actively import them.
Registered agents have immutable public keys, and each `POST /actions` request
must include an Ed25519 `agentProof` over the manifest hash, action ID,
connection ID, agent ID, and timestamp. Wallet feed reads require a short-lived
session token from `POST /wallet-sessions`, created by a wallet-owner
sign-message proof. The API never receives wallet private keys.

Approved decisions must include both:

- `signature`: devnet transaction signature returned by Mobile Wallet Adapter
- `receiptAddress`: SkillGuard `ActionReceipt` PDA recorded by the mobile app
