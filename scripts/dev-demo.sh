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
echo "  . scripts/dev-env.sh && EXPO_PUBLIC_SKILLGUARD_API_URL=http://10.0.2.2:8787 npm --prefix apps/mobile run android"

wallet_placeholder="<connected-mobile-wallet-address>"
wallet_value="${SKILLGUARD_USER_WALLET:-$wallet_placeholder}"
agent_key_placeholder="<agent-secret-key-from-password-manager>"
agent_key_value="${SKILLGUARD_AGENT_PRIVATE_KEY_B58:-${SKILLGUARD_AGENT_PRIVATE_KEY:-$agent_key_placeholder}}"

cat <<EOF
==> Agent request commands
Connect the wallet in the Android app, copy the full wallet address, then run
the command below in a third terminal while this script keeps API and site alive.
Import and approve the Research Agent pairing first; the loop then submits the
free scan, paid 0.001 SOL report, and blocked 0.05 SOL upgrade in sequence.

  export SKILLGUARD_API_URL="$API_URL"
  export SKILLGUARD_USER_WALLET="$wallet_value"
  export SKILLGUARD_AGENT_PRIVATE_KEY_B58="$agent_key_value"
  npm --prefix apps/research-agent run agent:loop

The mobile app can refresh if push delivery is unavailable. The paid request can
be approved and recorded on devnet; the upgrade is blocked before wallet signing.
EOF

if [ "${SKILLGUARD_AUTORUN_AGENT:-0}" = "1" ] && [ -n "${SKILLGUARD_USER_WALLET:-}" ]; then
  if [ -z "${SKILLGUARD_AGENT_PRIVATE_KEY_B58:-${SKILLGUARD_AGENT_PRIVATE_KEY:-}}" ]; then
    echo "SKILLGUARD_AUTORUN_AGENT requires SKILLGUARD_AGENT_PRIVATE_KEY_B58 for real wallets." >&2
    exit 1
  fi
  echo "==> Starting research-agent loop for wallet: ${SKILLGUARD_USER_WALLET}"
  env SKILLGUARD_API_URL="$API_URL" SKILLGUARD_USER_WALLET="$SKILLGUARD_USER_WALLET" \
    SKILLGUARD_AGENT_PRIVATE_KEY_B58="${SKILLGUARD_AGENT_PRIVATE_KEY_B58:-$SKILLGUARD_AGENT_PRIVATE_KEY}" \
    npm --prefix apps/research-agent run agent:loop &
  pids+=("$!")
fi

echo "==> Demo services are running. Press Ctrl-C to stop API and site."
wait
