#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/dev-env.sh"

MOBILE_DIR="$ROOT_DIR/apps/mobile"
OUTPUT_DIR="$ROOT_DIR/build/mobile"
BUILD_PROFILE="${SKILLGUARD_ANDROID_BUILD_PROFILE:-debug}"

case "$BUILD_PROFILE" in
  debug)
    GRADLE_TASK="assembleDebug"
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
    OUTPUT_APK="$OUTPUT_DIR/skillguard-debug.apk"
    BUILD_LABEL="debug"
    ;;
  standalone)
    GRADLE_TASK="assembleRelease"
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"
    OUTPUT_APK="$OUTPUT_DIR/skillguard-standalone-debugsigned.apk"
    BUILD_LABEL="standalone debug-signed"
    ;;
  *)
    echo "Unsupported SKILLGUARD_ANDROID_BUILD_PROFILE: $BUILD_PROFILE" >&2
    echo "Use debug or standalone." >&2
    exit 1
    ;;
esac

cd "$MOBILE_DIR"
npx expo prebuild --platform android --no-install

cd "$MOBILE_DIR/android"
./gradlew "$GRADLE_TASK"

mkdir -p "$OUTPUT_DIR"
cp "$APK_PATH" "$OUTPUT_APK"

echo "Built $BUILD_LABEL APK: $OUTPUT_APK"
