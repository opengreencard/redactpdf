#!/bin/bash
set -eu

# k8s/variables.sh — default values for the redaction Kubernetes deployment.
#
# All variables declared here can be overridden by passing corresponding flags
# to fill-templates.sh or setup-cluster.sh. They are sourced by those scripts.

# Keep DOMAIN in sync with the hosts in k8s/templates/ingress.template.yml.
export DOMAIN=redactpdf.ai

export REPLICAS=2

# Keep ACME_EMAIL in sync with k8s/templates/issuer.template.yml.
export ACME_EMAIL=letsencrypt@redactpdf.ai

# Keep CLUSTER_NAME in sync with the default in k8s/setup-cluster.sh.
export CLUSTER_NAME=redaction-production

# DigitalOcean tag applied to the cluster and every worker node pool. The
# database Cloud Firewall uses this tag as the MariaDB source allowlist.
export CLUSTER_TAG=redaction-production

# Keep this in sync with `fwName` in the immigration GitLab repository:
# https://gitlab.com/travelchime/immigration/-/blob/main/sysadmin/create-db-server.sh
export DB_FIREWALL_NAME=immigration-prod-db

# Keep REGION in sync with the default in k8s/setup-cluster.sh.
export REGION=sfo3
