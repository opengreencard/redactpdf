#!/bin/bash
set -euo pipefail

# Core Spaces setup logic. Sourced by setup-spaces.sh; not meant to be executed
# directly.

ensureDoctlSpacesSupport() {
  if ! command -v doctl > /dev/null; then
    echo 'Error: doctl is not installed.'
    exit 1
  fi

  if ! doctl spaces keys list > /dev/null 2>&1; then
    cat <<END
Error: This doctl version does not support Spaces commands.
Install doctl 1.167.0 or newer (for example: brew install doctl).
END
    exit 1
  fi
}

ensureAwsCli() {
  if ! command -v aws > /dev/null; then
    echo 'Error: aws CLI is not installed. Install it before running this script.'
    exit 1
  fi
}

redactionBucketName() {
  local bucketPrefix="$1"
  local bucketSuffix="$2"
  printf 'redaction-%s-%s' "$bucketPrefix" "$bucketSuffix"
}

spacesBucketUrn() {
  local bucketName="$1"
  printf 'do:space:%s' "$bucketName"
}

bucketExists() {
  local bucketName="$1"
  aws s3api head-bucket \
    --bucket "$bucketName" \
    --endpoint-url "$SPACES_ENDPOINT" > /dev/null 2>&1
}

createBucketIfMissing() {
  local bucketName="$1"
  if bucketExists "$bucketName"; then
    echo "Bucket already exists: $bucketName"
    return 0
  fi

  echo "Creating bucket: $bucketName"
  aws s3 mb "s3://$bucketName" \
    --region "$SPACES_REGION" \
    --endpoint-url "$SPACES_ENDPOINT"
}

assignBucketToProject() {
  local projectId="$1"
  local bucketName="$2"
  doctl projects resources assign "$projectId" \
    --resource "$(spacesBucketUrn "$bucketName")"
}

buildScopedKeyGrants() {
  local grants=()
  local bucketName
  for bucketName in "$@"; do
    grants+=("bucket=${bucketName};permission=readwrite")
  done
  local IFS=,
  printf '%s' "${grants[*]}"
}

createScopedSpacesKey() {
  local keyName="$1"
  local grants="$2"
  doctl spaces keys create "$keyName" --grants "$grants" --output json
}

createTemporaryFullaccessKeyJson() {
  doctl spaces keys create "$TEMP_FULLACCESS_KEY_NAME" \
    --grants 'bucket=;permission=fullaccess' \
    --output json
}

deleteSpacesKeyByAccessKeyId() {
  local accessKeyId="$1"
  doctl spaces keys delete "$accessKeyId"
}

exportAwsCredentialsFromKeyJson() {
  local keyJson="$1"
  export AWS_ACCESS_KEY_ID
  export AWS_SECRET_ACCESS_KEY
  AWS_ACCESS_KEY_ID=$(printf '%s' "$keyJson" | jq -r '.[0].access_key')
  AWS_SECRET_ACCESS_KEY=$(printf '%s' "$keyJson" | jq -r '.[0].secret_key')
}

envFileHasPlaceholderS3Credentials() {
  local envFilePath="$1"
  grep -q '^S3_ACCESS_KEY_ID=replace-with-s3-access-key-id' "$envFilePath" \
    || grep -q '^S3_SECRET_ACCESS_KEY=replace-with-s3-secret-access-key' "$envFilePath"
}

setupSpacesForEnvironment() {
  local environment="$1"
  local repoRoot="$2"
  local bucketPrefix="$3"
  local projectId="$4"
  local projectName="$5"
  local keyName="$6"
  local envFile="$7"
  local regenerateKeys="$8"

  local envFilePath="$repoRoot/$envFile"
  local bucketNames=()
  local bucketSuffix
  for bucketSuffix in "${BUCKET_SUFFIXES[@]}"; do
    bucketNames+=("$(redactionBucketName "$bucketPrefix" "$bucketSuffix")")
  done

  echo "Setting up Spaces for $environment ($projectName, prefix=$bucketPrefix)..."

  if [ ! -f "$envFilePath" ]; then
    echo "Error: $envFilePath does not exist. Create it before running this script."
    exit 1
  fi

  local tempKeyJson
  tempKeyJson=$(createTemporaryFullaccessKeyJson)
  local tempAccessKeyId
  tempAccessKeyId=$(printf '%s' "$tempKeyJson" | jq -r '.[0].access_key')
  exportAwsCredentialsFromKeyJson "$tempKeyJson"

  local bucketName
  for bucketName in "${bucketNames[@]}"; do
    createBucketIfMissing "$bucketName"
    assignBucketToProject "$projectId" "$bucketName"
  done

  deleteSpacesKeyByAccessKeyId "$tempAccessKeyId"

  local shouldCreateKey='false'
  if [ "$regenerateKeys" = 'true' ] || envFileHasPlaceholderS3Credentials "$envFilePath"; then
    shouldCreateKey='true'
  fi

  if [ "$shouldCreateKey" = 'true' ]; then
    local grants
    grants=$(buildScopedKeyGrants "${bucketNames[@]}")
    local scopedKeyJson
    scopedKeyJson=$(createScopedSpacesKey "$keyName" "$grants")
    local accessKeyId
    local secretAccessKey
    accessKeyId=$(printf '%s' "$scopedKeyJson" | jq -r '.[0].access_key')
    secretAccessKey=$(printf '%s' "$scopedKeyJson" | jq -r '.[0].secret_key')
    updateEnvS3Credentials "$envFilePath" "$accessKeyId" "$secretAccessKey"
    cat <<END
Done for $environment.
  Project: $projectName
  Buckets: ${bucketNames[*]}
  Key name: $keyName
  Updated: $envFile
END
  else
    cat <<END
Done for $environment (buckets only; existing S3 credentials kept).
  Project: $projectName
  Buckets: ${bucketNames[*]}
  Env file: $envFile
  Pass --regenerate-keys to create a new scoped key and update the env file.
END
  fi
}

updateEnvS3Credentials() {
  local envFilePath="$1"
  local accessKeyId="$2"
  local secretAccessKey="$3"

  # Idempotent line replacement for the two S3 credential variables.
  if grep -q '^S3_ACCESS_KEY_ID=' "$envFilePath"; then
    sed -i '' "s|^S3_ACCESS_KEY_ID=.*|S3_ACCESS_KEY_ID=$accessKeyId|" "$envFilePath"
  else
    printf '\nS3_ACCESS_KEY_ID=%s\n' "$accessKeyId" >> "$envFilePath"
  fi

  if grep -q '^S3_SECRET_ACCESS_KEY=' "$envFilePath"; then
    sed -i '' "s|^S3_SECRET_ACCESS_KEY=.*|S3_SECRET_ACCESS_KEY=$secretAccessKey|" "$envFilePath"
  else
    printf 'S3_SECRET_ACCESS_KEY=%s\n' "$secretAccessKey" >> "$envFilePath"
  fi
}
