# Title: Configure Gemini production secrets and Kubernetes database access

## Motivation

Loom video: https://www.loom.com/share/9cbfaed1d9ef455f85e3fc4d067e640d?from_recorder=1&focus_title=1

- Get everything ready for hosting the production site on redactpdf.ai.
- Use Gemini for production redaction after testing multiple models.
- Let the Kubernetes application reach the production database through the database firewall.
- Keep the cluster tag and firewall name aligned with the related deployment setup.

## Changes

- Inject `GEMINI_API_KEY` into the production Kubernetes Secret and update the 1Password generation and environment references.
- Keep DeepInfra and OpenAI keys available for local model comparisons without injecting them into Kubernetes.
- Tag the cluster and worker node pool with `redaction-production`, then idempotently allow that tag to reach MariaDB on port 3306.
- Remove the automatic local production-database firewall mutation from the environment wrapper.
- Clarify provider configuration and environment examples so Gemini is the production provider.

## Testing

- Automated checks
  - `bash -n k8s/setup-cluster.sh`
  - `git diff --check`
  - Pre-commit and pre-push hooks pass.
- Deployment verification
  - Run:
    `bash k8s/setup-cluster.sh --revision 1aeb38bcad5ea124230328fa8991cdee6d168c39`
  - Confirm the `redaction-production` firewall rule allows TCP/3306.
  - Confirm the main application deployment reaches 2/2 available replicas.
  - Upload a document in the deployed site and verify the redaction flow works.
  - Note: the background worker currently restarts after exiting with code 0; that is separate follow-up work.

Generated with help from `/loom-mr`, but edited
