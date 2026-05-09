# Vercel Deployment

SkillGuard can be deployed to Vercel as a public project site plus API endpoint.

## What This Enables

- public site at `https://<project>.vercel.app`
- API under `https://<project>.vercel.app/api`
- mobile app builds can point to that endpoint with `EXPO_PUBLIC_SKILLGUARD_API_URL`
- demo-agent can submit actions with `SKILLGUARD_API_URL`

## Deploy

The current production alias is:

```text
https://skillguard-xi.vercel.app
https://skillguard-xi.vercel.app/api
```

Create a Vercel project from this repository and keep the repository root as the
Vercel root directory. The committed `vercel.json` uses:

```text
buildCommand: npm run vercel:build
outputDirectory: apps/site/dist
API function: api/[...path].ts
```

## GitHub Actions Deploy

The committed workflow `.github/workflows/deploy-vercel.yml` deploys production
on every push to `main` and can also be run manually.

Add these GitHub repository secrets:

```text
VERCEL_TOKEN=<Vercel account token>
VERCEL_ORG_ID=team_vEhaNraQT5wsCNqQHTaQK6IR
VERCEL_PROJECT_ID=prj_AtfLJcdoXAFc3KDRrP1JYYr0rLf2
```

If the secrets are missing, the workflow exits successfully with a warning so
normal pushes are not blocked before Vercel is configured.

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
curl https://skillguard-xi.vercel.app/api/health
```

Expected hosted response after KV/Upstash is configured:

```json
{"ok":true,"service":"skillguard-api","storage":"upstash"}
```

After deployment, configure clients:

```bash
export SKILLGUARD_API_URL=https://skillguard-xi.vercel.app/api
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm --prefix apps/demo-agent run submit:safe

EXPO_PUBLIC_SKILLGUARD_API_URL=https://skillguard-xi.vercel.app/api \
  npm --prefix apps/mobile run android
```
