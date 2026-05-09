# Vercel Deployment

SkillGuard can be deployed to Vercel as a public project site plus API endpoint.

## What This Enables

- public site at `https://<project>.vercel.app`
- API under `https://<project>.vercel.app/api`
- mobile app builds can point to that endpoint with `EXPO_PUBLIC_SKILLGUARD_API_URL`
- research-agent can submit actions with `SKILLGUARD_API_URL`

## Deploy

The current production alias is:

```text
https://skillguard-sol.vercel.app
https://skillguard-sol.vercel.app/api
```

Create a Vercel project from this repository and keep the repository root as the
Vercel root directory. The committed `vercel.json` uses:

```text
buildCommand: VITE_BASE_PATH=/ npm run vercel:build
outputDirectory: apps/site/dist
API function: api/[...path].ts
```

## Vercel Git Deploy

The repository is connected directly to the Vercel project. Vercel deploys
production from `main` on push, using the committed `vercel.json`.

No GitHub repository secrets are required for Vercel deploys while the Vercel
Git integration remains connected.

## Durable Storage

The hosted API needs a shared store because Vercel functions can run in separate
instances across requests. Configure either Vercel KV or Upstash Redis on the
Vercel project, then redeploy.

Supported Vercel runtime env vars:

```text
KV_REST_API_URL=<Vercel KV REST API URL>
KV_REST_API_TOKEN=<Vercel KV REST API token>
```

Supported direct Upstash runtime env vars:

```text
UPSTASH_REDIS_REST_URL=<Upstash Redis REST URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash Redis REST token>
```

Verify the runtime storage mode:

```bash
curl https://skillguard-sol.vercel.app/api/health
```

Expected hosted response after KV/Upstash is configured:

```json
{"ok":true,"service":"skillguard-api","storage":"upstash"}
```

Run the hosted smoke after each production deploy:

```bash
node scripts/hosted-smoke.mjs
```

The smoke uses a generated wallet and run id, submits a safe request, rejects it,
submits an unsafe overspend request, submits after revocation, and verifies the
wallet action history from the hosted API.

After deployment, configure clients:

```bash
export SKILLGUARD_API_URL=https://skillguard-sol.vercel.app/api
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm --prefix apps/research-agent run submit:safe

EXPO_PUBLIC_SKILLGUARD_API_URL=https://skillguard-sol.vercel.app/api \
  npm --prefix apps/mobile run android
```
