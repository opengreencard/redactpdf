#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load the 1Password account configuration.
# shellcheck source=k8s/1password/variables.sh
. "$DIR/variables.sh"

function print_help_and_exit {
  cat <<'END'
Usage:
  bash k8s/1password/run-in-env.sh --env <environment> -- <command> [args...]

Sources the selected non-secret env file, optional local secret env file,
and matching 1Password pointers, then executes the command with the
corresponding APP_MODE.

Options:
  --env <environment>  production or development.
  --help               Show this help.

Examples:
  bash k8s/1password/run-in-env.sh --env development -- yarn dev:next
  bash k8s/1password/run-in-env.sh --env production -- yarn swc-node scripts/initializeDatabases.ts
END
}

ENVIRONMENT=''

while [ $# -gt 0 ]; do
  case $1 in
    --env) ENVIRONMENT="$2"; shift 2;;
    --help) print_help_and_exit; exit 0;;
    --) shift; break;;
    *) echo "Unknown argument: $1"; print_help_and_exit; exit 1;;
  esac
done

if [ -z "$ENVIRONMENT" ]; then
  echo 'Error: --env is required.'
  print_help_and_exit
  exit 1
fi

case "$ENVIRONMENT" in
  production)
    nonsecretEnvFile="$DIR/../../.env.production.nonsecret"
    envFile="$DIR/../../.env.production"
    opSecretsFile="$DIR/op-secrets.production.env"
    ;;
  development)
    nonsecretEnvFile="$DIR/../../.env.development.nonsecret"
    envFile="$DIR/../../.env.development"
    opSecretsFile="$DIR/op-secrets.development.env"
    ;;
  *)
    echo "Error: unsupported environment '$ENVIRONMENT'."
    exit 1
    ;;
esac

if [ $# -eq 0 ]; then
  echo 'Error: No command provided.'
  print_help_and_exit
  exit 1
fi

# Check 1Password CLI is installed and authenticated.
# shellcheck source=k8s/1password/check.sh
. "$DIR/check.sh"

# Source committed non-secret values, then any local secret env file.
set -a
# shellcheck source=/dev/null
. "$nonsecretEnvFile"
if [ -f "$envFile" ]; then
  # shellcheck source=/dev/null
  . "$envFile"
fi
set +a

export APP_MODE="$ENVIRONMENT"

if [ "$ENVIRONMENT" = 'production' ]; then
  # Local production-db development still needs local OAuth redirects.
  export NEXTAUTH_URL=http://localhost:3000

  # Before running, whitelist the developer's IP on the DB Cloud Firewall.
  if command -v doctl > /dev/null 2>&1 && doctl account get > /dev/null 2>&1; then
    bash "$DIR/../../dev/add-db-firewall-ip.sh" 2>/dev/null || true
  fi
fi

exec op run --env-file="$opSecretsFile" -- "$@"
