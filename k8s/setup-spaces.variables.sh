#!/bin/bash
# Variables appear unused here because consumers source this file.
# shellcheck disable=SC2034
set -euo pipefail

# Shared constants for DigitalOcean Spaces setup. Sourced by setup-spaces.sh
# and setup-spaces.lib.sh.

SPACES_REGION='sfo3'
SPACES_ENDPOINT="https://${SPACES_REGION}.digitaloceanspaces.com"

# Keep project IDs in sync with doctl projects list.
DEV_PROJECT_ID='df6f8c10-4fb5-4bdf-8c37-55efe6a449bf'
DEV_PROJECT_NAME='redactpdf-dev'
PROD_PROJECT_ID='7b6d5b76-fe0b-4d9c-93da-7bf96f9463fb'
PROD_PROJECT_NAME='redactpdf-prod'

# Bucket suffixes match lib/storage/buckets.ts S3Bucket enum values.
BUCKET_SUFFIXES=(files data)

TEMP_FULLACCESS_KEY_NAME='redaction-setup-temp'
