#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load 1Password account configuration from variables.sh.
# shellcheck source=k8s/1password/variables.sh
. "$DIR/variables.sh"

function print_help_and_exit {
  cat <<'END'
Usage:
  bash fill-secrets-template.sh [OPTION]...

Reads secrets from a 1Password item, fills k8s/config/secret.yml, and applies
the secret to the configured Kubernetes cluster.

Options:
  --name <name>  1Password item name (default: redaction-production).
  --help         Show this help.

Examples:
  bash fill-secrets-template.sh
  bash fill-secrets-template.sh --name redaction-test
END
}

NAME="$productionSecretName"

while [ $# -gt 0 ]; do
  case $1 in
    --name) NAME="$2"; shift 2;;
    --help) print_help_and_exit; exit 0;;
    *) print_help_and_exit; exit 1;;
  esac
done

# Check 1Password CLI is installed and authenticated.
# This script exits with a helpful message if op is missing or not signed in.
# shellcheck source=k8s/1password/check.sh
. "$DIR/check.sh"

itemFQN="op://$productionVault/$NAME"

echo "Reading secrets from $itemFQN..."

# op read writes the field value to stdout; stderr goes to inherited stderr.
# stdin is redirected from /dev/null so op doesn't consume piped input.
dbPass=$(op read "$itemFQN/DB_PASS" < /dev/null)
authSecret=$(op read "$itemFQN/AUTH_SECRET" < /dev/null)
googleClientId=$(op read "$itemFQN/GOOGLE_CLIENT_ID" < /dev/null)
googleClientSecret=$(op read "$itemFQN/GOOGLE_CLIENT_SECRET" < /dev/null)
s3AccessKeyId=$(op read "$itemFQN/S3_ACCESS_KEY_ID" < /dev/null)
s3SecretAccessKey=$(op read "$itemFQN/S3_SECRET_ACCESS_KEY" < /dev/null)
deepinfraApiKey=$(op read "$itemFQN/DEEPINFRA_API_KEY" < /dev/null)

mkdir -p "$DIR/../config"

# Fill placeholders in secret.template.yml. Use | as the sed delimiter
# because base64-encoded secrets contain / characters.
sed \
  -e "s|%DB_PASS%|$dbPass|g" \
  -e "s|%AUTH_SECRET%|$authSecret|g" \
  -e "s|%GOOGLE_CLIENT_ID%|$googleClientId|g" \
  -e "s|%GOOGLE_CLIENT_SECRET%|$googleClientSecret|g" \
  -e "s|%S3_ACCESS_KEY_ID%|$s3AccessKeyId|g" \
  -e "s|%S3_SECRET_ACCESS_KEY%|$s3SecretAccessKey|g" \
  -e "s|%DEEPINFRA_API_KEY%|$deepinfraApiKey|g" \
  "$DIR/../templates/secret.template.yml" > "$DIR/../config/secret.yml"

# Ensure kubectl is connected before applying the secret to the cluster.
bash "$DIR/../ensure-kubectl-on-right-account.sh"
kubectl apply -f "$DIR/../config/secret.yml"

cat <<END
Done! Created and applied k8s/config/secret.yml.
END
