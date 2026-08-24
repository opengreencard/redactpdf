#!/bin/bash
set -euo pipefail

# shellcheck source=k8s/ensure-doctl-on-right-account.sh
. "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/ensure-doctl-on-right-account.sh"

# The DigitalOcean context name is generated from the region and cluster name,
# while users may rename the kubectl context. Keep the cluster identifier here
# so context lookup does not depend on the context's display name.
expectedCluster='do-sfo3-ogc-production'
clusterName='ogc-production'

# Verify the DigitalOcean account and cluster only when credentials need to be
# downloaded. Callers that already have a reachable context do not need doctl.
checkDoctlCluster() {
  ensureDoctlAccount
  if ! doctl kubernetes cluster get "$clusterName" > /dev/null 2>&1; then
    echo "Cluster $clusterName not found in the opengreencard DigitalOcean account."
    exit 1
  fi
}

findContextForCluster() {
  kubectl config view -o jsonpath='{range .contexts[*]}{.name}{"\t"}{.context.cluster}{"\n"}{end}' \
    | awk -F'\t' -v cluster="$expectedCluster" '$2 == cluster {print $1; exit}'
}

# Point kubectl at the production cluster, downloading credentials only when
# no existing kubeconfig context can reach the redaction deployment.
ensureKubectlContext() {
  local currentContext ctx

  currentContext=$(kubectl config current-context 2>/dev/null || true)

  if [ -n "$currentContext" ]; then
    local currentCluster
    currentCluster=$(kubectl config view -o jsonpath="{.contexts[?(@.name==\"$currentContext\")].context.cluster}")
    if [ "$currentCluster" = "$expectedCluster" ] \
        && kubectl --context="$currentContext" get deployment redaction -n default \
          --request-timeout=5s > /dev/null 2>&1; then
      echo "Using kubectl context: $currentContext"
      exit 0
    fi
  fi

  ctx=$(findContextForCluster)
  if [ -n "$ctx" ] \
      && kubectl --context="$ctx" get deployment redaction -n default \
        --request-timeout=5s > /dev/null 2>&1; then
    echo "Switching kubectl context from ${currentContext:-<none>} to $ctx"
    kubectl config use-context "$ctx"
    exit 0
  fi

  checkDoctlCluster
  echo "Fetching kubeconfig for cluster $clusterName via doctl..."
  doctl kubernetes cluster kubeconfig save "$clusterName"
  ctx=$(findContextForCluster)
  if [ -n "$ctx" ]; then
    echo "Using kubectl context: $ctx"
    kubectl config use-context "$ctx"
    exit 0
  fi

  cat <<END
Could not find a kubectl context for cluster $expectedCluster.
Current context: ${currentContext:-<none>}
END
  exit 1
}

ensureKubectlContext
