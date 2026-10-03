#!/bin/bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  cat <<'END'
Usage: yarn typecheck:files -- <file1.ts> [file2.ts ...]
END
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/.." || exit 1

# tsc ignores the project configuration when source files are passed directly.
# Use a temporary project so targeted checks keep the repository's settings.
filesJSON=$(printf '%s\n' "$@" | jq --raw-input . | jq --slurp .)
jq --null-input \
  --argjson files "$filesJSON" \
  '{
    extends: "./tsconfig",
    include: ([
      "**/types/**/*.ts",
      "**/*.d.ts"
    ] + $files)
  }' > tsconfig.tmp.json

exitCode=0
yarn tsc --project tsconfig.tmp.json || exitCode=$?
rm -f tsconfig.tmp.json
exit "$exitCode"
