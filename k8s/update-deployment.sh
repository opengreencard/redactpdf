#!/bin/bash
set -eo pipefail
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

REVISION=$(git -C "$DIR/.." rev-parse HEAD)
TIMEOUT=600s

while [ $# -gt 0 ]; do
  case $1 in
    --revision) REVISION="$2"; shift 2;;
    --timeout) TIMEOUT="$2"; shift 2;;
    --help)
      cat <<'END'
Usage:
bash update-deployment.sh [OPTION]...
Updates the redaction Kubernetes deployment to a new image revision.

Options:
  --revision  [revision]  Git commit hash for the Docker image tag.
                          Defaults to $(git rev-parse HEAD).
  --timeout   [seconds]   Rollout timeout (default: 600s).
  --help                  Show this help.
END
      exit 0
      ;;
    *)
      echo "Error: Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Keep IMAGE in sync with GitHub Actions workflow (build-image job) and
# k8s/templates/cluster.template.yml.
image="redaction/redaction"

bash "$DIR/ensure-kubectl-on-right-account.sh"

echo "Updating redaction deployment to $image:$REVISION"

# Verify the image exists on Docker Hub
if ! docker manifest inspect "$image:$REVISION" > /dev/null 2>&1; then
  cat <<END
Image $image:$REVISION not found on Docker Hub.

The image is built and pushed by CI on the default branch.
To deploy a hotfix:
  1. Push your branch and open a merge request
  2. Wait for the 'build-image' CI job to complete
  3. Run this script again
END
  exit 1
fi

kubectl set image deployment/redaction redaction="$image:$REVISION"
kubectl annotate deployment/redaction \
  kubernetes.io/change-cause="Updated to revision $REVISION at $(date)"
kubectl rollout status deployment/redaction --timeout="$TIMEOUT"

kubectl set image deployment/redaction-background-worker \
  redaction-background-worker="$image:$REVISION"
kubectl annotate deployment/redaction-background-worker \
  kubernetes.io/change-cause="Updated to revision $REVISION at $(date)"
kubectl rollout status deployment/redaction-background-worker --timeout="$TIMEOUT"

echo "Application and background worker deployments updated to $image:$REVISION"
