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

DEFAULT_API_URL="https://skillguard-sol.vercel.app/api"
API_URL="${SKILLGUARD_API_URL:-$DEFAULT_API_URL}"

DEFAULT_AGENT_ENV_PATH="${HOME}/.skillguard/agent-research-live-230105.env"
AGENT_ENV_PATH="${SKILLGUARD_AGENT_ENV_PATH:-$DEFAULT_AGENT_ENV_PATH}"

if [ ! -f "$AGENT_ENV_PATH" ]; then
  echo "Missing live agent env file: $AGENT_ENV_PATH" >&2
  echo "Generate or restore the live Demo Agent key before running the demo." >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
. "$AGENT_ENV_PATH"
set +a

: "${SKILLGUARD_AGENT_ID:?Missing SKILLGUARD_AGENT_ID in live agent env.}"
: "${SKILLGUARD_AGENT_NAME:?Missing SKILLGUARD_AGENT_NAME in live agent env.}"
: "${SKILLGUARD_AGENT_DESCRIPTION:?Missing SKILLGUARD_AGENT_DESCRIPTION in live agent env.}"
: "${SKILLGUARD_AGENT_PRIVATE_KEY_B58:?Missing SKILLGUARD_AGENT_PRIVATE_KEY_B58 in live agent env.}"

PAIRING_HTML="${SKILLGUARD_PAIRING_HTML:-$ROOT_DIR/build/pairing/agent-research-live.html}"
PAIRING_QR="${SKILLGUARD_PAIRING_QR:-$ROOT_DIR/build/pairing/agent-research-live-qr.png}"
PAIRING_LINK_FILE="${SKILLGUARD_PAIRING_LINK_FILE:-$ROOT_DIR/build/pairing/agent-research-live-link.txt}"

USER_WALLET="${1:-${SKILLGUARD_USER_WALLET:-}}"
if [ -z "$USER_WALLET" ] && [ -t 0 ]; then
  printf "Paste the wallet address shown in the SkillGuard app: "
  read -r USER_WALLET
fi

if [ -z "$USER_WALLET" ]; then
  echo "Usage: scripts/live-demo.sh <connected-mobile-wallet-address>" >&2
  echo "Or set SKILLGUARD_USER_WALLET before running it." >&2
  exit 1
fi

open_pairing_target() {
  local target="$1"

  if [ "${SKILLGUARD_OPEN_QR:-1}" != "1" ]; then
    return
  fi

  if command -v open >/dev/null 2>&1; then
    open "$target"
    return
  fi

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$target" >/dev/null 2>&1 &
    return
  fi

  echo "Open this pairing file manually: $target"
}

PAIRING_TARGET=""
if [ -f "$PAIRING_HTML" ]; then
  PAIRING_TARGET="$PAIRING_HTML"
elif [ -f "$PAIRING_QR" ]; then
  PAIRING_TARGET="$PAIRING_QR"
fi

cat <<EOF
==> SkillGuard hosted live demo
API:    $API_URL
Wallet: $USER_WALLET
Agent:  $SKILLGUARD_AGENT_NAME ($SKILLGUARD_AGENT_ID)

1. The pairing QR is opening now.
2. In the mobile app: Pair -> Scan QR.
3. Review the agent identity and policy.
4. Sign the pairing/import challenge from your devnet wallet.
5. Come back here only after the app says the agent was imported.
EOF

if [ -n "$PAIRING_TARGET" ]; then
  echo "QR page: $PAIRING_TARGET"
  open_pairing_target "$PAIRING_TARGET"
else
  echo "No local QR image/page found under build/pairing." >&2
fi

if [ -f "$PAIRING_LINK_FILE" ]; then
  echo
  echo "Fallback pairing link:"
  cat "$PAIRING_LINK_FILE"
  echo
fi

if [ "${SKILLGUARD_SKIP_PAIRING_WAIT:-0}" != "1" ]; then
  echo
  printf "Press Enter after the mobile app shows the imported agent..."
  read -r
fi

echo
echo "==> Starting Demo Agent loop"
echo "The loop submits: free scan -> 0.001 SOL paid report -> blocked 0.05 SOL upgrade."
echo "Approve/reject from the app Inbox. Ctrl-C stops the loop."

env \
  SKILLGUARD_API_URL="$API_URL" \
  SKILLGUARD_USER_WALLET="$USER_WALLET" \
  SKILLGUARD_AGENT_ID="$SKILLGUARD_AGENT_ID" \
  SKILLGUARD_AGENT_NAME="$SKILLGUARD_AGENT_NAME" \
  SKILLGUARD_AGENT_DESCRIPTION="$SKILLGUARD_AGENT_DESCRIPTION" \
  SKILLGUARD_AGENT_PRIVATE_KEY_B58="$SKILLGUARD_AGENT_PRIVATE_KEY_B58" \
  npm --prefix apps/research-agent run agent:loop
