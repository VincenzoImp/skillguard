# Vercel Deployment

SkillGuard can be deployed to Vercel as a public project site plus API endpoint.

## What This Enables

- public site at `https://<project>.vercel.app`
- API under `https://<project>.vercel.app/api`
- mobile app builds can point to that endpoint with `EXPO_PUBLIC_SKILLGUARD_API_URL`
- demo-agent can submit actions with `SKILLGUARD_API_URL`

## Deploy

Create a Vercel project from this repository and keep the repository root as the
Vercel root directory. The committed `vercel.json` uses:

```text
buildCommand: npm run vercel:build
outputDirectory: apps/site/dist
API function: api/[...path].ts
```

After deployment, configure clients:

```bash
export SKILLGUARD_API_URL=https://<project>.vercel.app/api
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm --prefix apps/demo-agent run submit:safe

EXPO_PUBLIC_SKILLGUARD_API_URL=https://<project>.vercel.app/api \
  npm --prefix apps/mobile run android
```

## Storage Boundary

The committed Vercel API entrypoint uses a warm-instance memory store. That is
enough for a short live demo on a warm function, but it is not a production-grade
worldwide state layer because serverless instances can cold-start or run in
parallel.

For the final hosted hackathon demo, attach a shared Vercel/Upstash Redis store
or another durable database, then persist `agents`, `connections`, and `actions`
through that store. Until that storage is attached, the local API remains the
most deterministic option for recording the full demo flow end to end.
