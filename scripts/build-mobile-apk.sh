#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/dev-env.sh"

MOBILE_DIR="$ROOT_DIR/apps/mobile"
OUTPUT_DIR="$ROOT_DIR/build/mobile"
APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
OUTPUT_APK="$OUTPUT_DIR/skillguard-debug.apk"

cd "$MOBILE_DIR"
npx expo prebuild --platform android --no-install

cd "$MOBILE_DIR/android"
./gradlew assembleDebug

mkdir -p "$OUTPUT_DIR"
cp "$APK_PATH" "$OUTPUT_APK"

echo "Built debug APK: $OUTPUT_APK"
