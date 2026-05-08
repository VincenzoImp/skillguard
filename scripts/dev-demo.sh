#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/dev-env.sh"

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$ROOT_DIR/.env"
  set +a
fi

API_URL="${SKILLGUARD_API_URL:-http://localhost:8787}"
SITE_HOST="${SKILLGUARD_SITE_HOST:-127.0.0.1}"
SITE_PORT="${SKILLGUARD_SITE_PORT:-5173}"
RUN_PREFIX="${SKILLGUARD_RUN_ID:-local-demo}"

pids=()

cleanup() {
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT INT TERM

echo "==> Starting SkillGuard API on ${API_URL}"
npm --prefix apps/api run dev &
pids+=("$!")

echo "==> Starting SkillGuard site on http://${SITE_HOST}:${SITE_PORT}"
npm --prefix apps/site run dev -- --host "$SITE_HOST" --port "$SITE_PORT" --strictPort &
pids+=("$!")

echo "==> Waiting for local services"
sleep 3

echo "==> Mobile app"
echo "Open a second terminal and run:"
echo "  . scripts/dev-env.sh && npm --prefix apps/mobile run android"

echo "==> Demo agent: unsafe request"
env SKILLGUARD_API_URL="$API_URL" SKILLGUARD_RUN_ID="${RUN_PREFIX}-unsafe" \
  npm --prefix apps/demo-agent run submit:unsafe

echo "==> Demo agent: safe request"
env SKILLGUARD_API_URL="$API_URL" SKILLGUARD_RUN_ID="${RUN_PREFIX}-safe" \
  npm --prefix apps/demo-agent run submit:safe

echo "==> Demo agent: revoked request"
env SKILLGUARD_API_URL="$API_URL" SKILLGUARD_RUN_ID="${RUN_PREFIX}-revoked" \
  npm --prefix apps/demo-agent run submit:revoked

echo "==> Demo services are running. Press Ctrl-C to stop API and site."
wait
