#!/bin/bash
set -euo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$(cd "$DIR/.." && pwd)"

# shellcheck source=k8s/ensure-doctl-on-right-account.sh
. "$DIR/ensure-doctl-on-right-account.sh"
# shellcheck source=k8s/setup-spaces.variables.sh
. "$DIR/setup-spaces.variables.sh"
# shellcheck source=k8s/setup-spaces.lib.sh
. "$DIR/setup-spaces.lib.sh"

function print_help_and_exit {
  cat <<'END'
Usage:
  bash k8s/setup-spaces.sh [--env development|production|all] [--regenerate-keys]

Creates redaction-{prefix}-{files|data} Spaces buckets in sfo3, assigns them to
the redactpdf-dev or redactpdf-prod DigitalOcean project, and optionally creates
scoped access keys via doctl and writes S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY
into the matching .env file.

Bucket names follow lib/storage/buckets.ts:
  redaction-{S3_BUCKET_PREFIX}-files
  redaction-{S3_BUCKET_PREFIX}-data

Prerequisites:
  - doctl 1.167.0+ with Spaces support (brew install doctl)
  - aws CLI
  - jq
  - Authenticated doctl context: opengreencard

Examples:
  bash k8s/setup-spaces.sh --env development
  bash k8s/setup-spaces.sh --env all

By default, scoped keys are created only when the env file still has placeholder
S3 credentials. Pass --regenerate-keys to create a new key and update the env
file. Old keys are not deleted automatically.
END
}

ENVIRONMENT='all'
REGENERATE_KEYS='false'

while [ $# -gt 0 ]; do
  case "$1" in
    --env)
      ENVIRONMENT="$2"
      shift 2
      ;;
    --regenerate-keys)
      REGENERATE_KEYS='true'
      shift
      ;;
    --help|-h)
      print_help_and_exit
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      print_help_and_exit
      exit 1
      ;;
  esac
done

ensureDoctlAccount
ensureDoctlSpacesSupport
ensureAwsCli

case "$ENVIRONMENT" in
  development)
    setupSpacesForEnvironment \
      'development' \
      "$REPO_ROOT" \
      'dev' \
      "$DEV_PROJECT_ID" \
      "$DEV_PROJECT_NAME" \
      'redaction-env-development' \
      '.env.development' \
      "$REGENERATE_KEYS"
    ;;
  production)
    setupSpacesForEnvironment \
      'production' \
      "$REPO_ROOT" \
      'prod' \
      "$PROD_PROJECT_ID" \
      "$PROD_PROJECT_NAME" \
      'redaction-env-production' \
      '.env.production' \
      "$REGENERATE_KEYS"
    ;;
  all)
    setupSpacesForEnvironment \
      'development' \
      "$REPO_ROOT" \
      'dev' \
      "$DEV_PROJECT_ID" \
      "$DEV_PROJECT_NAME" \
      'redaction-env-development' \
      '.env.development' \
      "$REGENERATE_KEYS"
    setupSpacesForEnvironment \
      'production' \
      "$REPO_ROOT" \
      'prod' \
      "$PROD_PROJECT_ID" \
      "$PROD_PROJECT_NAME" \
      'redaction-env-production' \
      '.env.production' \
      "$REGENERATE_KEYS"
    ;;
  *)
    echo "Error: --env must be development, production, or all."
    exit 1
    ;;
esac
