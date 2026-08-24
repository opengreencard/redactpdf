#!/bin/bash

# Downloads GitHub pull request review threads with pagination, then extracts
# comments, git show commands, and discussion thread IDs for agent workflows.
#
# Principles:
# 1. Single script execution: runs procedurally as one cohesive unit
# 2. Echo all commands: every command is echoed before execution
# 3. Final output: echo discussion thread IDs for creating TODOs

set -e

print_help_and_exit() {
  if [ -n "$1" ]; then
    echo "$1"
  fi
  cat <<'END'
Usage: download-pull-request-comments.sh <owner/repo> <pull_request_number>

Downloads all review threads from a GitHub pull request with automatic pagination,
then extracts and displays comments and discussion thread IDs.

Arguments:
  owner/repo            Repository slug (e.g., opengreencard/redactpdf)
  pull_request_number   Pull request number (e.g., 42)

Example:
  download-pull-request-comments.sh opengreencard/redactpdf 42
END
  exit 1
}

REPOSITORY="$1"
PULL_REQUEST_NUMBER="$2"

if [ -z "$REPOSITORY" ] || [ -z "$PULL_REQUEST_NUMBER" ]; then
  print_help_and_exit 'Missing required arguments'
fi

OWNER="${REPOSITORY%%/*}"
REPO="${REPOSITORY#*/}"

if [ -z "$OWNER" ] || [ -z "$REPO" ] || [ "$OWNER" = "$REPO" ]; then
  print_help_and_exit "Invalid repository slug: $REPOSITORY (expected owner/repo)"
fi

if ! command -v gh >/dev/null 2>&1; then
  print_help_and_exit 'gh CLI is required but not installed'
fi

scriptDir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
tempJSON=$(mktemp)
cursor=''
page=1

echo '[]' > "$tempJSON"

while true; do
  if [ -z "$cursor" ]; then
    echo "Fetching page $page..."
    echo "Running: gh api graphql -f query=... -f owner=$OWNER -f repo=$REPO -F number=$PULL_REQUEST_NUMBER"
    response=$(gh api graphql -f query='query($owner: String!, $repo: String!, $number: Int!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          reviewThreads(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              isResolved
              isOutdated
              comments(first: 100) {
                nodes {
                  id
                  databaseId
                  body
                  author { login }
                  path
                  line
                  originalLine
                  commit { oid }
                }
              }
            }
          }
        }
      }
    }' -f owner="$OWNER" -f repo="$REPO" -F number="$PULL_REQUEST_NUMBER" -f cursor='')
  else
    echo "Fetching page $page..."
    echo "Running: gh api graphql -f query=... -f owner=$OWNER -f repo=$REPO -F number=$PULL_REQUEST_NUMBER -f cursor=$cursor"
    response=$(gh api graphql -f query='query($owner: String!, $repo: String!, $number: Int!, $cursor: String) {
      repository(owner: $owner, name: $repo) {
        pullRequest(number: $number) {
          reviewThreads(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              isResolved
              isOutdated
              comments(first: 100) {
                nodes {
                  id
                  databaseId
                  body
                  author { login }
                  path
                  line
                  originalLine
                  commit { oid }
                }
              }
            }
          }
        }
      }
    }' -f owner="$OWNER" -f repo="$REPO" -F number="$PULL_REQUEST_NUMBER" -f cursor="$cursor")
  fi

  threads=$(echo "$response" | jq '.data.repository.pullRequest.reviewThreads.nodes')
  itemCount=$(echo "$threads" | jq 'length')
  echo "  Found $itemCount review threads"

  jq -s 'add' "$tempJSON" <(echo "$threads") > "${tempJSON}.new"
  mv "${tempJSON}.new" "$tempJSON"

  hasNextPage=$(echo "$response" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
  if [ "$hasNextPage" != 'true' ]; then
    break
  fi

  cursor=$(echo "$response" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor')
  page=$((page + 1))
done
echo

echo "Total review threads fetched: $(jq 'length' "$tempJSON")"
echo

echo '=== Comments ==='
echo "Running: jq -f $scriptDir/extract-github-comments.jq $tempJSON"
jq -f "$scriptDir/extract-github-comments.jq" "$tempJSON"

echo
cat <<'END'
=== File Contents at time of comment ===

Below are the git commands you can use to view the file contents:

END
echo "Running: jq -r -f $scriptDir/extract-github-sha-and-paths.jq $tempJSON | sort -u"
jq -r -f "$scriptDir/extract-github-sha-and-paths.jq" "$tempJSON" | \
  sort -u | \
  while IFS=: read -r sha path; do
    if [ -n "$sha" ] && [ "$sha" != 'null' ] && [ -n "$path" ]; then
      echo "git show $sha:$path"
    fi
  done

echo
cat <<'END'
=== Discussion Thread IDs ===

NEXT STEP: Create one TODO for each of the discussion thread IDs below.
These are the unresolved discussion threads that need to be addressed.
END
echo "Running: jq -f $scriptDir/extract-github-discussion-thread-ids.jq $tempJSON"
jq -f "$scriptDir/extract-github-discussion-thread-ids.jq" "$tempJSON"

rm "$tempJSON"
