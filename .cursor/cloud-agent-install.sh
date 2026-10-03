#!/usr/bin/env bash
# Cursor Cloud Agent install.
#
# Copies the env examples once, then installs packages. Docker starts on
# boot from .cursor/cloud-agent-start.sh.
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

# The VM also has Node 22 on PATH. This app needs Node 26.
# Keep in sync with .cursor/cloud-agent-start.sh.
export PATH="/usr/local/bin:${PATH}"

# The replace-with-... placeholders are enough to boot. Skip the copy when
# the file is already there so we don't wipe a real key.
if [ ! -f .env.development ]; then
  cp .env.development.example .env.development
fi
if [ ! -f .env.test ]; then
  cp .env.test.example .env.test
fi

yarn install --immutable
