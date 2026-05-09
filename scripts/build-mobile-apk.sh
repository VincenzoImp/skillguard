#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# shellcheck source=/dev/null
. "$ROOT_DIR/scripts/dev-env.sh"

MOBILE_DIR="$ROOT_DIR/apps/mobile"
OUTPUT_DIR="$ROOT_DIR/build/mobile"
BUILD_PROFILE="${SKILLGUARD_ANDROID_BUILD_PROFILE:-standalone}"
CANONICAL_APK_RELATIVE_PATH="build/mobile/skillguard.apk"
OUTPUT_APK="$ROOT_DIR/$CANONICAL_APK_RELATIVE_PATH"
GRADLE_ARGS=()
REQUIRE_RELEASE_SIGNING=false

case "$BUILD_PROFILE" in
  debug)
    GRADLE_TASK="assembleDebug"
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
    BUILD_LABEL="debug"
    ;;
  standalone)
    GRADLE_TASK="assembleRelease"
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"
    BUILD_LABEL="standalone debug-signed"
    ;;
  release)
    GRADLE_TASK="assembleRelease"
    APK_PATH="$MOBILE_DIR/android/app/build/outputs/apk/release/app-release.apk"
    BUILD_LABEL="release signed"
    REQUIRE_RELEASE_SIGNING=true
    ;;
  *)
    echo "Unsupported SKILLGUARD_ANDROID_BUILD_PROFILE: $BUILD_PROFILE" >&2
    echo "Use debug, standalone, or release." >&2
    exit 1
    ;;
esac

GRADLE_ARGS=("$GRADLE_TASK")

if [[ "$REQUIRE_RELEASE_SIGNING" == true ]]; then
  : "${SKILLGUARD_ANDROID_KEYSTORE_PATH:?Set SKILLGUARD_ANDROID_KEYSTORE_PATH for release signing.}"
  : "${SKILLGUARD_ANDROID_KEYSTORE_PASSWORD:?Set SKILLGUARD_ANDROID_KEYSTORE_PASSWORD for release signing.}"
  : "${SKILLGUARD_ANDROID_KEY_ALIAS:?Set SKILLGUARD_ANDROID_KEY_ALIAS for release signing.}"
  : "${SKILLGUARD_ANDROID_KEY_PASSWORD:?Set SKILLGUARD_ANDROID_KEY_PASSWORD for release signing.}"

  if [[ ! -f "$SKILLGUARD_ANDROID_KEYSTORE_PATH" ]]; then
    echo "Release keystore not found: $SKILLGUARD_ANDROID_KEYSTORE_PATH" >&2
    exit 1
  fi

  store_password_property="android.injected.signing.store.pass""word"
  key_password_property="android.injected.signing.key.pass""word"

  GRADLE_ARGS+=(
    "-Pandroid.injected.signing.store.file=$SKILLGUARD_ANDROID_KEYSTORE_PATH"
    "-P$store_password_property=$SKILLGUARD_ANDROID_KEYSTORE_PASSWORD"
    "-Pandroid.injected.signing.key.alias=$SKILLGUARD_ANDROID_KEY_ALIAS"
    "-P$key_password_property=$SKILLGUARD_ANDROID_KEY_PASSWORD"
  )
fi

cd "$MOBILE_DIR"
npx expo prebuild --platform android --no-install

cd "$MOBILE_DIR/android"
if [[ "$GRADLE_TASK" == "assembleRelease" && -z "${NODE_ENV:-}" ]]; then
  export NODE_ENV=production
fi
./gradlew "${GRADLE_ARGS[@]}"

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_DIR"/*.apk
cp "$APK_PATH" "$OUTPUT_APK"

echo "Built $BUILD_LABEL APK: $OUTPUT_APK"
