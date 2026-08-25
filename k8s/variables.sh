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

# Keep DB_FIREWALL_NAME in sync with sysadmin/create-db-server.sh and
# dev/add-db-firewall-ip.sh.
export DB_FIREWALL_NAME=redaction-prod-db

# Keep REGION in sync with the default in k8s/setup-cluster.sh.
export REGION=sfo3
