#!/bin/bash

# Fetches GitHub Actions run metadata and failed-step logs for a public
# workflow URL using the gh CLI.
#
# Principles:
# 1. Single script execution: runs procedurally as one cohesive unit
# 2. Echo all commands: every command is echoed before execution
# 3. Final output: print job summary, then failed logs

set -e

print_help_and_exit() {
  if [ -n "$1" ]; then
    echo "$1"
  fi
  cat <<'END'
Usage: read-github-actions-output.sh <github-actions-url>

Fetches job metadata and failed-step logs for a GitHub Actions run.

The URL may be a run page or a specific job page, with or without query
parameters:

  https://github.com/owner/repo/actions/runs/123
  https://github.com/owner/repo/actions/runs/123/job/456?pr=1

Example:
  bash .cursor/skills/read-github-actions-output/scripts/read-github-actions-output.sh \
    'https://github.com/opengreencard/redactpdf/actions/runs/32789090040/job/97626938421?pr=1'
END
  exit 1
}

ACTIONS_URL="$1"

if [ -z "$ACTIONS_URL" ]; then
  print_help_and_exit 'Missing required GitHub Actions URL'
fi

if ! command -v gh >/dev/null 2>&1; then
  print_help_and_exit 'gh CLI is required but not installed'
fi

if ! command -v jq >/dev/null 2>&1; then
  print_help_and_exit 'jq is required but not installed'
fi

cleanURL="${ACTIONS_URL%%\?*}"
cleanURL="${cleanURL%/}"

# https://github.com/owner/repo/actions/runs/123[/job/456]
if [[ ! "$cleanURL" =~ github\.com/([^/]+)/([^/]+)/actions/runs/([0-9]+)(/job/([0-9]+))? ]]; then
  print_help_and_exit "Unrecognized GitHub Actions URL: $ACTIONS_URL"
fi

owner="${BASH_REMATCH[1]}"
repo="${BASH_REMATCH[2]}"
runID="${BASH_REMATCH[3]}"
jobID="${BASH_REMATCH[5]}"
repository="$owner/$repo"

echo "Repository: $repository"
echo "Run ID: $runID"
if [ -n "$jobID" ]; then
  echo "Job ID: $jobID"
fi
echo

echo '=== Run summary ==='
echo "Running: gh run view $runID --repo $repository --json name,displayTitle,event,headBranch,headSha,status,conclusion,url,jobs"
gh run view "$runID" --repo "$repository" --json name,displayTitle,event,headBranch,headSha,status,conclusion,url,jobs \
  | jq '{
      name,
      displayTitle,
      event,
      headBranch,
      headSha,
      status,
      conclusion,
      url,
      jobs: [.jobs[] | {databaseId, name, status, conclusion}]
    }'

if [ -n "$jobID" ]; then
  echo
  echo '=== Job details ==='
  echo "Running: gh api repos/$repository/actions/jobs/$jobID"
  gh api "repos/$repository/actions/jobs/$jobID" \
    | jq '{
        id,
        name,
        status,
        conclusion,
        started_at,
        completed_at,
        html_url,
        steps: [.steps[] | {number, name, status, conclusion, started_at, completed_at}]
      }'
fi

echo
echo '=== Failed logs ==='
if [ -n "$jobID" ]; then
  echo "Running: gh run view $runID --repo $repository --job $jobID --log-failed"
  gh run view "$runID" --repo "$repository" --job "$jobID" --log-failed
else
  echo "Running: gh run view $runID --repo $repository --log-failed"
  gh run view "$runID" --repo "$repository" --log-failed
fi
