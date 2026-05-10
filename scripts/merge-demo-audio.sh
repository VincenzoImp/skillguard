#!/usr/bin/env bash
set -euo pipefail

video="${1:-build/demo/skillguard-story-silent.mp4}"
audio="${2:-build/demo/skillguard-voiceover-elevenlabs-tony.mp3}"
output="${3:-build/demo/skillguard-story-with-audio.mp4}"

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is required to merge the demo video and voiceover." >&2
  exit 1
fi

if [[ ! -f "$video" ]]; then
  echo "Missing video file: $video" >&2
  exit 1
fi

if [[ ! -f "$audio" ]]; then
  echo "Missing audio file: $audio" >&2
  exit 1
fi

mkdir -p "$(dirname "$output")"

ffmpeg -y \
  -i "$video" \
  -i "$audio" \
  -map 0:v:0 \
  -map 1:a:0 \
  -c:v copy \
  -c:a aac \
  -b:a 192k \
  -movflags +faststart \
  "$output"

echo "$output"
