---
name: loom-edit-file
description: Edit a specified file based on instructions from a Loom video or transcript.
disable-model-invocation: true
triggers:
  - user
---

# Edit a file from a Loom video or transcript

Can you edit this file based on instructions from a Loom video or transcript?

- If there's anything that might be misspelled or mistranscribed, feel free to
  search in code to get the correct names of types, names, etc.
- Be comprehensive and make all edits suggested, even if uncertain
- Do not hard-wrap lines for max length; copied output keeps those breaks

When this skill is invoked, ask for the below if not already provided:

1. File to edit
2. Loom video link
3. Loom transcript (optional)
   - If transcript is not provided, use
     @.cursor/skills/fetch-loom-transcript/SKILL.md to fetch it from the Loom
     link

## What the user passed in:

- File: $1
- Loom video link: $2
- Transcript: $3
