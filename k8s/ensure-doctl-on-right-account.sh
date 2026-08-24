#!/bin/bash
set -e

# Verify that doctl is installed, authenticated, and using the opengreencard
# DigitalOcean account. This file can be sourced to call ensureDoctlAccount or
# executed directly as a prerequisite check.
ensureDoctlAccount() {
  if ! command -v doctl > /dev/null; then
    echo "Error: doctl is not installed. Install it from https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
  fi

  local doctlContext='opengreencard'
  local authContexts
  if authContexts=$(doctl auth list 2>/dev/null) \
    && printf '%s\n' "$authContexts" | awk \
      -v context="$doctlContext" \
      '$1 == context && $2 != "(current)" { found=1 } END { exit !found }'; then
    echo "Switching doctl auth context to '$doctlContext'..."
    if ! doctl auth switch --context "$doctlContext" > /dev/null; then
      echo "Error: Could not switch doctl to auth context '$doctlContext'."
      exit 1
    fi
  fi

  if ! command -v jq > /dev/null; then
    echo "Error: jq is not installed. Install it before running this script."
    exit 1
  fi

  local accountJSON
  if ! accountJSON=$(doctl account get --output json 2>/dev/null); then
    echo "Error: doctl is not authenticated. Run 'doctl auth init'."
    exit 1
  fi

  local team
  if ! team=$(printf '%s' "$accountJSON" | jq -r '.team.name'); then
    echo 'Error: Could not determine the team for the active doctl account.'
    exit 1
  fi

  if [ "$team" != "opengreencard" ]; then
    echo "Error: doctl is authenticated to team '$team', expected 'opengreencard'."
    echo "Run 'doctl auth init' with the correct account."
    exit 1
  fi
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  ensureDoctlAccount
fi
