#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# shellcheck source=k8s/ensure-doctl-on-right-account.sh
. "$DIR/ensure-doctl-on-right-account.sh"

function print_help_and_exit {
  cat <<'END'
Usage:
bash setup-cluster.sh --revision <git-hash> [OPTION]...

Creates a DigitalOcean Kubernetes cluster with ingress-nginx and cert-manager,
then applies all redaction Kubernetes manifests.

Required:
  --revision <hash>     Git commit hash for the Docker image tag.

Optional (override k8s/variables.sh defaults; mostly useful for testing
         against a non-production cluster):
  --cluster-name <name> Cluster name (default: redaction-production).
  --region <region>     DO region (default: sfo3).
  --acme-email <email>  Email for Let's Encrypt expiry notices.
  --replicas <num>      Number of replicas (default: 2).
  --1password-secrets-name <name>  1Password item name for secrets (default: redaction-production).

Prerequisites:
  - kubectl, doctl, docker, jq, helm installed
  - Authenticate to DigitalOcean with 'doctl auth init'
  - Authenticate to Docker with 'docker login'

Example:
  bash setup-cluster.sh --revision $(git rev-parse HEAD)

Testing a different cluster:
  bash setup-cluster.sh --revision $(git rev-parse HEAD) \
      --cluster-name redaction-testing --region nyc1
END
}

function check_installs {
  for requirement in "$@"; do
    if ! command -v "$requirement" > /dev/null; then
      echo "$requirement is not installed. Install it before running the script."
      exit 1
    fi
  done

  ensureDoctlAccount

  if ! [ -e ~/.docker/config.json ]; then
    echo "You must first sign into Docker with docker login"
    exit 1
  fi

  # Check docker is authenticated at all (public image to avoid scope issues).
  # docker manifest inspect works without a running daemon — it only talks to
  # the Docker Hub API, so this works on CI and remote dev machines.
  if ! docker manifest inspect hello-world:latest > /dev/null 2>&1; then
    echo "Docker is not authenticated to Docker Hub."
    echo "Run 'docker login' with the opengreencard Docker Hub account."
    exit 1
  fi

  # Verify the authenticated account has pull access to the redaction image.
  # This catches logging into the wrong account (e.g. personal instead of org).
  # docker manifest inspect outputs JSON to stdout on success, so we check the
  # exit code and capture stderr for error messages.
  local manifestError
  manifestError=$(docker manifest inspect "$image" 2>&1 >/dev/null)
  local manifestCode=$?
  if [ $manifestCode -ne 0 ]; then
    if echo "$manifestError" | grep -q "not found\|no such"; then
      echo "Docker image $image does not exist."
      echo "Make sure the revision has been pushed to Docker Hub."
    else
      echo "Cannot access $image — you may be logged into the wrong account."
      echo "Run 'docker login' with the opengreencard Docker Hub account."
    fi
    exit 1
  fi
}

# Load defaults from variables.sh
# shellcheck source=k8s/variables.sh
. "$DIR/variables.sh"

# Load the 1Password account configuration.
# shellcheck source=k8s/1password/variables.sh
. "$DIR/1password/variables.sh"

CLUSTER_NAME="${CLUSTER_NAME:-redaction-production}"
REGION="${REGION:-sfo3}"
REVISION=""
REPLICAS="${REPLICAS:-2}"

SECRETS_NAME="$productionSecretName"

while [ $# -gt 0 ]; do
  case $1 in
    --revision) REVISION="$2"; shift 2;;
    --cluster-name) CLUSTER_NAME="$2"; shift 2;;
    --region) REGION="$2"; shift 2;;
    --acme-email) ACME_EMAIL="$2"; shift 2;;
    --replicas) REPLICAS="$2"; shift 2;;
    --1password-secrets-name) SECRETS_NAME="$2"; shift 2;;
    --help) print_help_and_exit; exit 0;;
    *) print_help_and_exit; exit 1;;
  esac
done

if [ -z "$REVISION" ]; then
  cat <<'END'
Error: --revision is required.
Run with --help for more information.
END
  exit 1
fi

# Keep image in sync with GitHub Actions workflow (build-image job),
# k8s/templates/cluster.template.yml, and k8s/update-deployment.sh.
image="opengreencard/redactpdf:$REVISION"

check_installs kubectl doctl docker jq helm

cat <<END
Creating DigitalOcean Kubernetes cluster:
  Cluster name: $CLUSTER_NAME
  Region:       $REGION
  Node pool:    s-4vcpu-8gb, 2 nodes (no autoscaling)
  1-click apps: metrics-server, ingress-nginx, cert-manager
  ACME email:   $ACME_EMAIL
  Image:        $image
END

# Create the cluster, or skip if it already exists.
# `doctl kubernetes cluster create` is not idempotent — it errors if the cluster
# name is already taken. We check first so re-running the script is safe.
if doctl kubernetes cluster get "$CLUSTER_NAME" > /dev/null 2>&1; then
  echo "Cluster $CLUSTER_NAME already exists, skipping creation."
else
  doctl kubernetes cluster create "$CLUSTER_NAME" \
    --node-pool "name=webservers;size=s-4vcpu-8gb;count=2;auto-scale=false" \
    --1-clicks metrics-server,ingress-nginx,cert-manager \
    --region "$REGION"
fi

# Ensure kubectl is pointed at the right cluster, even if the cluster already
# existed (it may have been switched since the last run).
doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME"
echo "kubectl context: $(kubectl config current-context)"

# 1-click apps are installed asynchronously after cluster create returns
# ("Successfully kicked off addon job"). `kubectl wait` fails immediately if
# the namespace does not exist yet, so poll until cert-manager appears.
echo 'Waiting for cert-manager 1-click app to be installed...'
deadline=$((SECONDS + 600))
until kubectl get deployment cert-manager -n cert-manager >/dev/null 2>&1; do
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo 'Timed out waiting for cert-manager to be installed.'
    exit 1
  fi
  echo -n '.'
  sleep 5
done
echo

# cert-manager's HTTP-01 self-check uses the pod's DNS resolver for domain
# lookups. On DOKS, CoreDNS forwards to DO's internal resolver which can lag
# behind external DNS propagation. Pinning cert-manager to public DNS (8.8.8.8)
# avoids spurious "no such host" failures during certificate issuance.
echo 'Waiting for cert-manager to be ready...'
kubectl wait --for=condition=available deployment/cert-manager -n cert-manager --timeout=300s
kubectl patch deployment cert-manager -n cert-manager --type=strategic -p '
{
  "spec": {
    "template": {
      "spec": {
        "dnsPolicy": "None",
        "dnsConfig": {
          "nameservers": ["8.8.8.8", "8.8.4.4"],
          "searches": ["cert-manager.svc.cluster.local", "svc.cluster.local", "cluster.local"]
        }
      }
    }
  }
}'
kubectl rollout status deployment cert-manager -n cert-manager --timeout=120s

# Create or update the Docker registry secret for pulling images from Docker Hub.
# `kubectl create secret` is not idempotent — it errors if the secret already
# exists. Piping through `kubectl apply` makes it idempotent:
#   --dry-run=client -o yaml  generates the manifest without sending it to the API
#                              server, so it never fails on existing resources.
#   kubectl apply -f -         reads the manifest from stdin and creates or
#                              updates the resource, matching the "apply" semantics
#                              used by the rest of the script.
kubectl create secret generic regcred \
  --from-file=.dockerconfigjson="$(realpath ~/.docker/config.json)" \
  --type=kubernetes.io/dockerconfigjson \
  --dry-run=client -o yaml | kubectl apply -f -

# Fill templates
bash "$DIR/fill-templates.sh" \
  --revision "$REVISION" \
  --variables-file "$DIR/variables.sh"

# Fill secrets from 1Password
bash "$DIR/1password/fill-secrets-template.sh" --name "$SECRETS_NAME"

# Wait for ingress controller to get an external IP
echo "Waiting for ingress controller to get an external IP (this may take a few minutes)..."
externalIP=""
set +e
while [ -z "$externalIP" ]; do
  externalIP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2> /dev/null)
  echo -n '.'
  sleep 5
done
set -e
echo

cat <<END
Ingress controller IP: $externalIP

Set DNS A records at dns.he.net:
  redactpdf.ai     -> $externalIP
  www.redactpdf.ai -> $externalIP
END

# Install Prometheus + Grafana for monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts 2>/dev/null || true
helm repo update
kubectl create namespace monitor 2>/dev/null || true
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitor

# Apply configurations: issuer first so Ingress TLS can resolve, then everything else
kubectl apply -f "$DIR/config/issuer.yml"
kubectl apply -f "$DIR/config/namespace.yml"
kubectl apply -f "$DIR/config/cluster.yml"
kubectl apply -f "$DIR/config/ingress.yml"

cat <<'END'
============================================================
                        Success!
============================================================

Cluster created and manifests applied.

To check pod status:
  kubectl -n default get pods
  kubectl -n default get pods -l app=redaction-background-worker

To view Grafana (monitoring):
  kubectl -n monitor port-forward svc/prometheus-grafana 8080:80
  Then visit http://localhost:8080 (admin / prom-operator)

Pods should be ready in a few minutes. TLS certificates may take up to 10 minutes.
END
