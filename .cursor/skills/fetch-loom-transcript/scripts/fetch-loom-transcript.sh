#!/bin/bash
set -e

LOOM_URL="$1"

if [ -z "$LOOM_URL" ]; then
  cat <<'END'
Usage: bash scripts/fetch-loom-transcript.sh <loom-video-url>

Example:
  bash scripts/fetch-loom-transcript.sh https://www.loom.com/share/abc123

Fetches the transcript from a Loom video and displays it with timestamps.
Also prints screen URLs Loom captured during the recording, when present.
END
  exit 1
fi

# Fetch the Loom video page
cleanLoomUrl="${LOOM_URL%%\?*}"
# Replace //loom.com/ with //www.loom.com/
cleanLoomUrl="${cleanLoomUrl/\/\/loom.com\//\/\/www.loom.com\/}"
cleanLoomUrl="${cleanLoomUrl%/}"
videoId="${cleanLoomUrl##*/}"
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

jqFormatTime='
  def format_time(time):
    (time // 0 | floor) as $totalSeconds |
    (($totalSeconds / 60 | floor) | tostring) as $minutes |
    (($totalSeconds % 60 | tostring | if length == 1 then "0" + . else . end)) as $seconds |
    $minutes + ":" + $seconds;
'

# Screen URLs the recorder had open. Same unauthenticated GraphQL the share
# page uses (VideoLinksAndSettings); skip this section if Loom has none.
linksJson=$(curl -s 'https://www.loom.com/graphql' \
  --max-time 10 \
  -X POST \
  -H 'content-type: application/json' \
  --data "{\"operationName\":\"VideoLinksAndSettings\",\"variables\":{\"videoId\":\"${videoId}\"},\"query\":\"query VideoLinksAndSettings(\$videoId: ID!) { videoLinksAndSettings(videoId: \$videoId) { ... on VideoLinksAndSettings { links { url title startMs } } ... on GenericError { message } } }\"}") || true

if echo "$linksJson" | jq -e '.data.videoLinksAndSettings.links | type == "array" and length > 0' >/dev/null 2>&1; then
  echo "Screen URLs:"
  echo "$linksJson" | jq -r "${jqFormatTime}"'
    .data.videoLinksAndSettings.links[] |
    "[" + format_time(.startMs / 1000) + "] " + .url +
      (if .title != null and .title != "" then "  " + .title else "" end)
  '
  echo
fi

# Parse and format the transcript
# Loom uses a phrases array with ts (timestamp in seconds) and value (text)
echo "$transcriptJson" | jq -r "${jqFormatTime}"'
  .phrases[] | "[" + format_time(.ts) + "] " + .value
' 2>/dev/null
