#!/bin/bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

function print_help_and_exit {
  cat <<'END'
Usage:
bash fill-templates.sh --revision <git-hash> [OPTION]...

Fills in Kubernetes cluster templates and outputs them into k8s/config/.

Required:
  --revision <hash>     Git commit hash for the Docker image tag.

Optional (override k8s/variables.sh defaults; mostly useful for testing
         against a non-production cluster):
  --variables-file <file>  Path to a variables file (default: k8s/variables.sh).
                           Other options override values from this file.
  --domain <domain>        Primary domain.
  --replicas <num>         Number of replicas.
  --acme-email <email>     Email for Let's Encrypt expiry notices.

All options except --revision default to the values in k8s/variables.sh.
The script replaces %VARIABLE% placeholders in templates/ and writes results
to config/. The secret template is skipped — use k8s/fill-secrets-template.sh
for that.

Example:
  bash fill-templates.sh --revision $(git rev-parse HEAD)

Testing a different cluster:
  bash fill-templates.sh --revision $(git rev-parse HEAD) \
      --domain testing.redactpdf.ai
END
}

VARIABLES_FILE="$DIR/variables.sh"

while [ $# -gt 0 ]; do
  case $1 in
    --variables-file) VARIABLES_FILE="$2"; shift 2;;
    --revision) REVISION="$2"; shift 2;;
    --domain) DOMAIN="$2"; shift 2;;
    --replicas) REPLICAS="$2"; shift 2;;
    --acme-email) ACME_EMAIL="$2"; shift 2;;
    --help) print_help_and_exit; exit 0;;
    *) print_help_and_exit; exit 1;;
  esac
done

# Load defaults from variables.sh; CLI flags override these
# shellcheck source=k8s/variables.sh
. "$VARIABLES_FILE"

if [ -z "$REVISION" ]; then
  cat <<'END'
Error: --revision is required.
Run with --help for more information.
END
  exit 1
fi

if [ -z "$DOMAIN" ] || [ -z "$ACME_EMAIL" ] || [ -z "$REPLICAS" ]; then
  cat <<'END'
Error: Missing required variables. Make sure k8s/variables.sh exists and
defines DOMAIN, ACME_EMAIL, and REPLICAS, or pass them with the
corresponding --flags.
END
  exit 1
fi

templateDir="$DIR/templates"
outputDir="$DIR/config"

rm -rf "$outputDir"
mkdir -p "$outputDir"

sedScript="
s/%DOMAIN%/$DOMAIN/g;
s/%REPLICAS%/$REPLICAS/g;
s/%ACME_EMAIL%/$ACME_EMAIL/g;
s/%REVISION%/$REVISION/g;
"

# Skip secret.template.yml — it is filled by k8s/fill-secrets-template.sh instead
for filename in $(find "$templateDir" -type f -not -name 'secret.template.yml' \
  | sed "s@$templateDir/@@"); do
  newFilename="${filename/\.template/}"
  dir=$(dirname "$newFilename")
  mkdir -p "$outputDir/$dir"

  sed "$sedScript" "$templateDir/$filename" > "$outputDir/$newFilename"
done

cat <<END
Templates filled and written to $outputDir/
END
