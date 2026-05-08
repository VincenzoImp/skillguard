#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Staged files"
git diff --cached --name-status

echo
echo "==> Staged diff stat"
git diff --cached --stat

echo
echo "==> Secret-pattern scan"
private_key="PRIVATE"" KEY"
begin_rsa="BEGIN"" RSA"
begin_openssh="BEGIN"" OPENSSH"
api_token_marker="api[_-]?ke""y[[:space:]]*[:=]"
secret_word="secre""t[[:space:]]*[:=]"
password_word="passwor""d[[:space:]]*[:=]"
mnemonic_word="mnemon""ic[[:space:]]*[:=]"
seed_phrase="seed"" phrase"
secret_pattern="(${private_key}|${begin_rsa}|${begin_openssh}|${api_token_marker}|${secret_word}|${password_word}|${mnemonic_word}|${seed_phrase})"
if git diff --cached | grep -E "$secret_pattern" >/tmp/skillguard-secret-scan.txt; then
  cat /tmp/skillguard-secret-scan.txt >&2
  echo "Potential secret found in staged diff." >&2
  exit 1
fi

echo
echo "==> Security-claim scan"
claim_one="100%"" safe"
claim_two="guaranteed"" security"
claim_three="trustless"" AI security"
claim_four="universal"" wallet firewall"
claim_five="fully"" autonomous wallet control"
claim_pattern="(${claim_one}|${claim_two}|${claim_three}|${claim_four}|${claim_five})"
if git diff --cached | grep -E "$claim_pattern" >/tmp/skillguard-claim-scan.txt; then
  cat /tmp/skillguard-claim-scan.txt >&2
  echo "Unsupported security claim found in staged diff." >&2
  exit 1
fi

echo
echo "==> Generated-file scan"
if git diff --cached --name-only | grep -E '(^|/)(node_modules|dist|build|target|\.expo|\.vite)/|\.tsbuildinfo$|vite\.config\.(js|d\.ts)$' >/tmp/skillguard-generated-scan.txt; then
  cat /tmp/skillguard-generated-scan.txt >&2
  echo "Generated file staged." >&2
  exit 1
fi

echo
echo "==> Manual audit checklist"
echo "[ ] Scope is narrow and intentional"
echo "[ ] Docs match behavior and commands"
echo "[ ] Tests/build cover the changed surface"
echo "[ ] No unrelated files are staged"
echo "[ ] Security boundary remains honest"
echo "[ ] UI changes follow apps/site and docs/DESIGN_SYSTEM.md"

echo
echo "Audit script checks passed. Complete the manual checklist before committing."
