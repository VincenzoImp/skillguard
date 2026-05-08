# SkillGuard API

Backend API for agent registration, connect links, action manifests, policy evaluation, and approval/rejection webhooks.

Planned endpoints:

- `POST /api/agents/register`
- `POST /api/agents/connect-link`
- `POST /api/connections`
- `PATCH /api/connections/:connectionId/policy`
- `POST /api/connections/:connectionId/revoke`
- `POST /api/actions`
- `GET /api/actions/:actionId`
- `GET /api/actions/pending`
