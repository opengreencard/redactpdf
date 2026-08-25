#!/bin/bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load the 1Password account configuration.
# shellcheck source=k8s/1password/variables.sh
. "$DIR/variables.sh"

function print_help_and_exit {
  cat <<'END'
Usage:
  bash generate-secrets.sh [OPTION]...

Generates random production secrets and prompts for external provider
credentials, then saves them to the production 1Password item.

Options:
  --name <name>  1Password item name (default: redaction-production).
  --overwrite    Overwrite all existing fields. Without this, only missing
                 fields are filled in (safe to re-run).
  --help         Show this help.

Examples:
  bash generate-secrets.sh
  bash generate-secrets.sh --name redaction-test
  bash generate-secrets.sh --overwrite
END
}

NAME="$productionSecretName"
OVERWRITE='false'

while [ $# -gt 0 ]; do
  case $1 in
    --name) NAME="$2"; shift 2;;
    --overwrite) OVERWRITE='true'; shift;;
    --help) print_help_and_exit; exit 0;;
    *) print_help_and_exit; exit 1;;
  esac
done

# Check 1Password CLI is installed and authenticated.
# shellcheck source=k8s/1password/check.sh
. "$DIR/check.sh"

# Check whether the item already exists.
# stdin is redirected from /dev/null so op commands do not consume piped input.
itemExists='false'
itemFQN="op://$productionVault/$NAME"
itemJSON=''
if itemJSON=$(op item get "$NAME" --vault "$productionVault" --format json < /dev/null 2>/dev/null); then
  itemExists='true'
fi

if [ "$itemExists" != 'true' ]; then
  echo "Creating new 1Password item '$NAME' in vault '$productionVault'..."
elif [ "$OVERWRITE" = 'true' ]; then
  echo "Item '$NAME' already exists. Overwriting selected fields..."
else
  echo "Item '$NAME' already exists. Filling in missing fields only..."
fi

hasField() {
  local fieldName="$1"
  if [ "$itemExists" != 'true' ]; then
    return 1
  fi
  local value
  value=$(printf '%s\n' "$itemJSON" | jq -r --arg label "$fieldName" \
    '.fields[] | select(.label == $label) | .value // empty' 2>/dev/null) || true
  [ -n "$value" ]
}

dbPass=''
dbRootPass=''
authSecret=''
s3AccessKeyId=''
s3SecretAccessKey=''
googleClientId=''
googleClientSecret=''
deepinfraApiKey=''

if [ "$OVERWRITE" = 'true' ] || ! hasField 'S3_ACCESS_KEY_ID'; then
  echo 'Enter external provider secrets:'
  read -rep 'DigitalOcean Spaces access key ID (https://cloud.digitalocean.com/spaces/access_keys?i=30dfb5): ' s3AccessKeyId
  [ -n "$s3AccessKeyId" ] || { echo 'Error: S3 access key ID is required.'; exit 1; }
fi

if [ "$OVERWRITE" = 'true' ] || ! hasField 'S3_SECRET_ACCESS_KEY'; then
  read -rsp 'DigitalOcean Spaces secret access key: ' s3SecretAccessKey
  echo
  [ -n "$s3SecretAccessKey" ] || { echo 'Error: S3 secret access key is required.'; exit 1; }
fi

if [ "$OVERWRITE" = 'true' ] || ! hasField 'GOOGLE_CLIENT_ID'; then
  read -rep 'Google OAuth client ID (https://console.cloud.google.com/auth/clients/462401751644-3so004t6cgssrhprb3t9u2l82p10mo3q.apps.googleusercontent.com?project=redaction-430123): ' googleClientId
  [ -n "$googleClientId" ] || { echo 'Error: Google OAuth client ID is required.'; exit 1; }
fi

if [ "$OVERWRITE" = 'true' ] || ! hasField 'GOOGLE_CLIENT_SECRET'; then
  read -rsp 'Google OAuth client secret: ' googleClientSecret
  echo
  [ -n "$googleClientSecret" ] || { echo 'Error: Google OAuth client secret is required.'; exit 1; }
fi

if [ "$OVERWRITE" = 'true' ] || ! hasField 'DEEPINFRA_API_KEY'; then
  read -rsp 'Deep Infra API key (https://deepinfra.com/dash/api_keys): ' deepinfraApiKey
  echo
  [ -n "$deepinfraApiKey" ] || { echo 'Error: Deep Infra API key is required.'; exit 1; }
fi

if [ "$OVERWRITE" = 'true' ] || ! hasField 'DB_PASS'; then
  dbPass=$(openssl rand -base64 32)
fi
if [ "$OVERWRITE" = 'true' ] || ! hasField 'DB_ROOT_PASS'; then
  dbRootPass=$(openssl rand -base64 32)
fi
if [ "$OVERWRITE" = 'true' ] || ! hasField 'AUTH_SECRET'; then
  authSecret=$(openssl rand -base64 32)
fi

fieldAssignments=()
addField() {
  local name="$1"
  local value="$2"
  if [ -n "$value" ]; then
    fieldAssignments+=("$name=$value")
  fi
}

addField 'DB_PASS' "$dbPass"
addField 'DB_ROOT_PASS' "$dbRootPass"
addField 'AUTH_SECRET' "$authSecret"
addField 'GOOGLE_CLIENT_ID' "$googleClientId"
addField 'GOOGLE_CLIENT_SECRET' "$googleClientSecret"
addField 'S3_ACCESS_KEY_ID' "$s3AccessKeyId"
addField 'S3_SECRET_ACCESS_KEY' "$s3SecretAccessKey"
addField 'DEEPINFRA_API_KEY' "$deepinfraApiKey"

if [ ${#fieldAssignments[@]} -eq 0 ]; then
  echo "No new or missing fields to add. All secrets are already set in $itemFQN."
  exit 0
fi

echo "Fields to save: ${fieldAssignments[*]%=*}"
echo "Saving to $itemFQN..."

if [ "$itemExists" = 'true' ]; then
  op item edit "$NAME" \
    --vault "$productionVault" \
    "${fieldAssignments[@]}" \
    < /dev/null > /dev/null
else
  op item create \
    --vault "$productionVault" \
    --category Server \
    --title "$NAME" \
    "${fieldAssignments[@]}" \
    < /dev/null > /dev/null
fi

cat <<END

Done! Secrets saved to $itemFQN.

Next steps:
  bash k8s/1password/fill-secrets-template.sh   (write k8s/config/secret.yml)
END
