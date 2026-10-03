#!/usr/bin/env bash
# Cursor Cloud Agent install.
#
# The Cloud Agent environment runs this after checkout. It only prepares
# the repo. Docker and MariaDB are started on each boot by
# .cursor/cloud-agent-start.sh.
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$DIR/.." && pwd )"

# /exec-daemon/node is Node 22. This app requires Node 26 in /usr/local.
export PATH="/usr/local/bin:${PATH}"

# Copy a KEY= line from an example into an env file when that key is
# missing or blank. A value that is already set is left alone, so a real
# API key is not replaced.
#
# When fillEmptyValues is true, a blank example line gets a local stand-in
# so Auth.js and Docker Compose can boot. A new KEY= line in the example
# is picked up on the next run without editing this script.
sync_env_file() {
  local exampleFile="$1"
  local envFile="$2"
  local fillEmptyValues="$3"
  local line
  local key
  local exampleValue
  local desired

  if [ ! -f "$envFile" ]; then
    cp "$exampleFile" "$envFile"
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    if [[ ! "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      continue
    fi
    key="${BASH_REMATCH[1]}"
    exampleValue="${BASH_REMATCH[2]}"
    exampleValue="${exampleValue%$'\r'}"
    if [ "$exampleValue" = '""' ] || [ "$exampleValue" = "''" ]; then
      exampleValue=''
    fi

    desired="$exampleValue"
    if [ -z "$desired" ] && [ "$fillEmptyValues" = 'true' ]; then
      desired="$(stand_in_for_empty_development_value "$key")"
    fi
    set_env_key_if_blank "$envFile" "$key" "$desired"
  done < "$exampleFile"
}

# DB_PASS has to match the MariaDB user Docker Compose creates. An empty
# value would override Compose's ${DB_PASS:-redaction} default.
stand_in_for_empty_development_value() {
  local key="$1"
  if [ "$key" = 'DB_PASS' ]; then
    printf '%s' 'redaction'
    return
  fi
  printf '%s' 'local-dev-only'
}

set_env_key_if_blank() {
  local envFile="$1"
  local key="$2"
  local desired="$3"
  local currentLine=''
  local currentValue
  local tmpFile
  local replaced=0
  local existing

  currentLine="$(grep -E "^${key}=" "$envFile" | head -n 1 || true)"
  if [ -n "$currentLine" ]; then
    currentValue="${currentLine#*=}"
    if [ -n "$currentValue" ]; then
      return
    fi
    if [ -z "$desired" ]; then
      return
    fi
  fi

  tmpFile="$(mktemp)"
  while IFS= read -r existing || [ -n "$existing" ]; do
    if [ "$replaced" -eq 0 ] && [[ "$existing" == "${key}="* ]]; then
      printf '%s=%s\n' "$key" "$desired"
      replaced=1
    else
      printf '%s\n' "$existing"
    fi
  done < "$envFile" > "$tmpFile"
  if [ "$replaced" -eq 0 ]; then
    printf '%s=%s\n' "$key" "$desired" >> "$tmpFile"
  fi
  mv "$tmpFile" "$envFile"
}

main() {
  cd "$REPO_ROOT"
  # Development blanks are filled so the dev server can boot. Test blanks
  # stay blank: Jest replays mocks and should not see a fake API key.
  sync_env_file .env.development.example .env.development true
  sync_env_file .env.test.example .env.test false
  yarn install --immutable
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
