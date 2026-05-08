#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load repo-verified Solana, Anchor, Android, and Node 22 paths.
# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/dev-env.sh"

echo "==> Checking staged whitespace"
git diff --cached --check

echo "==> Checking forbidden generated files"
if git diff --cached --name-only | grep -E '(^|/)(node_modules|dist|build|target|\.expo|\.vite)/|\.tsbuildinfo$|vite\.config\.(js|d\.ts)$' >/dev/null; then
  echo "Generated files are staged. Remove them before committing." >&2
  git diff --cached --name-only | grep -E '(^|/)(node_modules|dist|build|target|\.expo|\.vite)/|\.tsbuildinfo$|vite\.config\.(js|d\.ts)$' >&2
  exit 1
fi

echo "==> Checking unresolved planning markers"
if git diff --cached --name-only | grep -E '\.(md|ts|tsx|js|jsx|json|rs|toml|sh)$' >/dev/null; then
  marker_pattern="\\b(TO""DO|TB""D|FIX""ME)\\b"
  if git grep -n -E "$marker_pattern" -- $(git diff --cached --name-only | grep -E '\.(md|ts|tsx|js|jsx|json|rs|toml|sh)$') >/tmp/skillguard-markers.txt 2>/dev/null; then
    cat /tmp/skillguard-markers.txt >&2
    echo "Resolve unresolved planning markers before committing." >&2
    exit 1
  fi
fi

echo "==> Building project site"
npm --prefix apps/site run build

if [ -f packages/protocol/package.json ]; then
  echo "==> Building protocol package"
  npm --prefix packages/protocol run build

  if find packages/protocol/src -name "*.test.ts" | grep -q .; then
    echo "==> Testing protocol package"
    npm --prefix packages/protocol test
  fi
fi

if [ -f packages/sdk/package.json ]; then
  echo "==> Building SDK package"
  npm --prefix packages/sdk run build

  if find packages/sdk/src \( -name "*.test.ts" -o -name "*.test.tsx" \) | grep -q .; then
    echo "==> Testing SDK package"
    npm --prefix packages/sdk test
  fi
fi

if [ -f apps/api/package.json ]; then
  echo "==> Building API"
  npm --prefix apps/api run build

  if find apps/api/src -name "*.test.ts" | grep -q .; then
    echo "==> Testing API"
    npm --prefix apps/api test
  fi
fi

if [ -f apps/demo-agent/package.json ]; then
  echo "==> Building demo agent"
  npm --prefix apps/demo-agent run build

  if find apps/demo-agent/src \( -name "*.test.ts" -o -name "*.test.tsx" \) | grep -q .; then
    echo "==> Testing demo agent"
    npm --prefix apps/demo-agent test
  fi
fi

if [ -f apps/mobile/package.json ]; then
  echo "==> Typechecking mobile app"
  npm --prefix apps/mobile run typecheck

  if find apps/mobile/src \( -name "*.test.ts" -o -name "*.test.tsx" \) | grep -q .; then
    echo "==> Testing mobile app"
    npm --prefix apps/mobile test
  fi

  echo "==> Checking Expo mobile project"
  npm --prefix apps/mobile run doctor
fi

if [ -f programs/skillguard/Anchor.toml ]; then
  if [ -f programs/skillguard/package.json ]; then
    echo "==> Linting Anchor workspace"
    npm --prefix programs/skillguard run lint
  fi

  echo "==> Checking Anchor Rust formatting"
  (cd programs/skillguard && cargo fmt --all --check)

  echo "==> Building Anchor program"
  (cd programs/skillguard && anchor build)

  echo "==> Testing Anchor program"
  (cd programs/skillguard && anchor test)
fi

echo "==> Pre-commit check passed"
