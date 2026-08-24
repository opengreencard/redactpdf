#!/bin/bash
# k8s/1password/variables.sh — 1Password account configuration shared by
# the scripts in this directory.
#
# These are sourced by scripts that interact with the 1Password CLI.

# Account for the opengreencard team. Useful if someone is logged into multiple
# 1Password accounts.
export OP_ACCOUNT=opengreencard.1password.com

# Keep these values synchronized with the corresponding op-secrets.*.env files.
# Sourced scripts consume these values; they are intentionally not exported.
productionVault='Production'
productionSecretName='redaction-production'

# Disable warning about unused variables: this is meant to be sourced
# shellcheck disable=SC2034
productionFQN="op://$productionVault/$productionSecretName"
developmentVault='Development'
developmentSecretName='redaction-development'

# Disable warning about unused variables: this is meant to be sourced
# shellcheck disable=SC2034
developmentFQN="op://$developmentVault/$developmentSecretName"
