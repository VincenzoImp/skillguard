#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/dev-env.sh" >/dev/null

PROGRAM_ID="HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam"
MWA_SIGNATURE="5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF"
REPOSITORY_URL="https://github.com/VincenzoImp/skillguard.git"
VERCEL_SITE_URL="https://skillguard-sol.vercel.app/"

check_file() {
  local path="$1"
  local hint="$2"

  if [[ -f "$path" ]]; then
    echo "ok: $path"
    return
  fi

  echo "missing: $path" >&2
  echo "hint: $hint" >&2
  exit 1
}

check_text() {
  local pattern="$1"
  local path="$2"

  if grep -F "$pattern" "$path" >/dev/null; then
    echo "ok: $path contains $pattern"
    return
  fi

  echo "missing text in $path: $pattern" >&2
  exit 1
}

check_apk_signature() {
  local apk_path="$1"
  local signer_output

  signer_output="$(mktemp)"

  local apksigner
  apksigner="$(find "$ANDROID_HOME/build-tools" -name apksigner -type f | sort | tail -1)"
  if [[ -z "$apksigner" ]]; then
    echo "missing: apksigner under $ANDROID_HOME/build-tools" >&2
    exit 1
  fi

  "$apksigner" verify --print-certs "$apk_path" >"$signer_output"
  check_text "Signer #1 certificate SHA-256 digest" "$signer_output"
  rm -f "$signer_output"
}

check_apk_endpoint() {
  local apk_path="$1"
  local bundle_output

  bundle_output="$(mktemp)"
  unzip -p "$apk_path" assets/index.android.bundle >"$bundle_output"
  check_text "https://skillguard-sol.vercel.app/api" "$bundle_output"

  if grep -E "10\\.0\\.2\\.2|:8787" "$bundle_output" >/dev/null; then
    echo "APK still contains a local API endpoint." >&2
    rm -f "$bundle_output"
    exit 1
  fi

  rm -f "$bundle_output"
}

echo "==> Submission source checks"
check_text "$PROGRAM_ID" README.md
check_text "$MWA_SIGNATURE" README.md
check_text "$VERCEL_SITE_URL" README.md
check_text "SKILLGUARD_ANDROID_BUILD_PROFILE=release" README.md
check_text "build/mobile/skillguard.apk" README.md
check_text "KV_REST_API_URL" docs/VERCEL.md
check_text "connected Git integration" README.md
check_text "Final owner-controlled upload keystore generated outside git" README.md
check_text "Target length: under 3 minutes." docs/DEMO.md
check_text "password manager backup of the final upload keystore and signing env" docs/ROADMAP.md

echo
echo "==> Submission artifact checks"
check_file "build/mobile/skillguard.apk" \
  ". scripts/dev-env.sh && scripts/build-mobile-apk.sh"
check_apk_signature "build/mobile/skillguard.apk"
check_apk_endpoint "build/mobile/skillguard.apk"

echo
echo "==> Repository checks"
remote_url="$(git remote get-url origin)"
if [[ "$remote_url" != "$REPOSITORY_URL" ]]; then
  echo "unexpected origin remote: $remote_url" >&2
  echo "expected: $REPOSITORY_URL" >&2
  exit 1
fi
echo "ok: origin remote configured"

if [[ -n "$(git status --short)" && "${SKILLGUARD_SUBMISSION_ALLOW_DIRTY:-0}" != "1" ]]; then
  echo "working tree is not clean" >&2
  git status --short >&2
  exit 1
fi
if [[ "${SKILLGUARD_SUBMISSION_ALLOW_DIRTY:-0}" == "1" ]]; then
  echo "ok: working tree cleanliness skipped for development run"
else
  echo "ok: working tree clean"
fi

echo
echo "Submission local package checks passed."
