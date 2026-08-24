#!/bin/bash
set -e

LOOM_URL="$1"

if [ -z "$LOOM_URL" ]; then
  cat <<'END'
Usage: bash scripts/fetch-loom-transcript.sh <loom-video-url>

Example:
  bash scripts/fetch-loom-transcript.sh https://www.loom.com/share/abc123

Fetches the transcript from a Loom video and displays it with timestamps.
END
  exit 1
fi

# Fetch the Loom video page
cleanLoomUrl="${LOOM_URL%%\?*}"
loomPage=$(curl -s "$cleanLoomUrl")

# Extract the JSON that contains source_url with the transcription URL
transcriptionUrl=$(echo "$loomPage" | grep -o '"source_url"[^}]*"https://cdn.loom.com[^"]*transcription[^"]*"' | grep -o 'https://cdn.loom.com[^"]*transcription[^"]*' | head -1)

if [ -z "$transcriptionUrl" ]; then
  echo "Error: Could not find transcription URL in Loom video page" >&2
  echo "The video might not have a transcript available." >&2
  exit 1
fi

# Fetch the transcription JSON
transcriptJson=$(curl -s "$transcriptionUrl")

# Check if we got valid JSON
if ! echo "$transcriptJson" | jq empty 2>/dev/null; then
  echo "Error: Invalid JSON received from transcription URL" >&2
  exit 1
fi

# Parse and format the transcript
# Loom uses a phrases array with ts (timestamp in seconds) and value (text)
echo "$transcriptJson" | jq -r '
  def format_time(time):
    (time // 0 | floor) as $totalSeconds |
    (($totalSeconds / 60 | floor) | tostring) as $minutes |
    (($totalSeconds % 60 | tostring | if length == 1 then "0" + . else . end)) as $seconds |
    $minutes + ":" + $seconds;

  .phrases[] | "[" + format_time(.ts) + "] " + .value
' 2>/dev/null
