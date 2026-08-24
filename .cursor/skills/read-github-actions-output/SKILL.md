---
name: read-github-actions-output
description: Fetch and analyze public GitHub Actions run logs using the gh CLI. Use when the user provides a GitHub Actions run or job URL, asks about CI failures, or needs to examine GitHub Actions job logs.
---

# Read GitHub Actions Output

When given a GitHub Actions run or job URL, fetch the public logs with:

```bash
bash .cursor/skills/read-github-actions-output/scripts/read-github-actions-output.sh '<github-actions-url>'
```

Always wrap the URL in single quotes. The script strips query parameters such
as `?pr=1`.

## Extracting Run Details

From a GitHub Actions URL like:

```
https://github.com/opengreencard/redactpdf/actions/runs/32789090040/job/97626938421?pr=1
```

Extract:

- **owner/repo**: `opengreencard/redactpdf`
- **run_id**: `32789090040` (the number after `/actions/runs/`)
- **job_id**: `97626938421` (the number after `/job/`, if present)

A run URL without `/job/` is also valid:

```
https://github.com/opengreencard/redactpdf/actions/runs/32789090040
```

## Example

```bash
bash .cursor/skills/read-github-actions-output/scripts/read-github-actions-output.sh \
  'https://github.com/opengreencard/redactpdf/actions/runs/32789090040/job/97626938421?pr=1'
```

## Output Handling

The script prints:

1. Run summary (status, conclusion, jobs)
2. Job details and steps when a job ID is present
3. Failed-step logs (`gh run view --log-failed`)

Analyze the output to:

- Identify failure points
- Extract error messages
- Understand which workflow step failed
- Summarize what happened

If failed logs are truncated or a later step's output is needed, re-run
`gh run view <run_id> --repo <owner/repo> --job <job_id> --log` for the full
job log. Do not use MCP tools for this; use `gh` as this repository's other
GitHub scripts do.
