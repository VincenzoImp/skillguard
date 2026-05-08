#!/usr/bin/env sh

# Source this file before running local Solana or Android commands:
#   . scripts/dev-env.sh
#
# These defaults match the macOS/Homebrew toolchain verified on 2026-05-08.

ANDROID_SDK_DEFAULT="/opt/homebrew/share/android-commandlinetools"
JAVA_HOME_DEFAULT="/opt/homebrew/opt/openjdk@17"
SOLANA_BIN_DEFAULT="$HOME/.local/share/solana/install/active_release/bin"
NODE_22_BIN_DEFAULT="/opt/homebrew/opt/node@22/bin"

export ANDROID_HOME="${ANDROID_HOME:-$ANDROID_SDK_DEFAULT}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export JAVA_HOME="${JAVA_HOME:-$JAVA_HOME_DEFAULT}"

export PATH="$SOLANA_BIN_DEFAULT:$NODE_22_BIN_DEFAULT:$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
