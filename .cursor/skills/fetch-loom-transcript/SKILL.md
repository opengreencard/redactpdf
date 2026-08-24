---
name: fetch-loom-transcript
description: Fetches transcripts from Loom videos. Use when you need a transcript from a Loom video but only have a Loom video link, or when the user mentions needing a transcript from a Loom video.
---

# Fetch Loom Transcript

When you need a transcript from a Loom video link, run:

```bash
bash .cursor/skills/fetch-loom-transcript/scripts/fetch-loom-transcript.sh <loom-video-url>
```

For example:

```bash
bash .cursor/skills/fetch-loom-transcript/scripts/fetch-loom-transcript.sh 'https://www.loom.com/share/6fe805595cbc46f5a6b689ca9bfebd55'
```

The script outputs the transcript with timestamps. Only outputs the transcript
(no informational messages) unless there's an error.

IMPORTANT: Always wrap the Loom URL in single quotes when running the command.
The script will strip query parameters automatically (for example,
`?from_recorder=1&focus_title=1`), so no manual cleanup is required.
