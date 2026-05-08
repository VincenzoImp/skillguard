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
- `GET /agents/:agentId`
- `POST /connections`
- `PATCH /connections/:connectionId/policy`
- `POST /connections/:connectionId/revoke`
- `POST /actions`
- `GET /actions/pending?wallet=...`
- `GET /actions/:actionId`
- `POST /actions/:actionId/evaluate`
- `POST /actions/:actionId/decision`

The MVP uses an in-memory seeded store. It includes `Research Agent`, demo connection `conn-demo`, safe action `action-safe-risk-report`, and unsafe action `action-unsafe-overspend`.
