#!/bin/bash

# k8s/1password/check.sh — shared 1Password CLI checks sourced by
# generate-secrets.sh, fill-secrets-template.sh, and run-in-env.sh.
#
# Sourcing this script exits with an error if the op CLI is missing or
# unauthenticated.
#
# All op commands redirect stdin from /dev/null so piped input from the
# parent shell (e.g., printf ... | bash generate-secrets.sh) doesn't
# interfere with op's own stdin handling.

# Load 1Password account configuration (OP_ACCOUNT).
# Compute our own directory so callers in different directories can source us
# without needing DIR to point here.
checkDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# shellcheck source=k8s/1password/variables.sh
. "$checkDir/variables.sh"
unset checkDir

if ! command -v op > /dev/null; then
  echo "Error: 1Password CLI (op) is not installed."
  echo "Install it with: brew install 1password-cli"
  exit 1
fi

if ! op vault list < /dev/null > /dev/null 2>&1; then
  # Check for the multi-account case specifically
  if op vault list < /dev/null 2>&1 | grep -q "multiple accounts found"; then
    cat <<'END'
Error: Multiple 1Password accounts are configured.
Set the OP_ACCOUNT environment variable to the account for opengreencard.1password.com.

To find the account shorthand:
  op account list

Then set it (or add to your shell profile):
  export OP_ACCOUNT=<shorthand>

Alternatively, use the --account flag on individual commands.
END
    exit 1
  fi

  cat <<'END'
Error: 1Password CLI is not authenticated.

To set up desktop app integration:
  1. Open 1Password Desktop
  2. Open Settings (⌘,)
  3. Go to Developer
  4. Under "Command-Line Interface", check "Integrate with 1Password CLI"

Alternatively, sign in manually:
  op account add
END
  exit 1
fi
