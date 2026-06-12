#!/usr/bin/env bash
set -euo pipefail

if ! command -v kubectl >/dev/null 2>&1; then
  echo "kubectl is required" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required" >&2
  exit 1
fi

NAMESPACE="${1:-grafana}"
SECRET_NAME="${2:-grafana-dashboard-writer}"
SECRET_KEY="${3:-token}"
GITHUB_SECRET_NAME="${4:-GRAFANA_SA_TOKEN}"
REPOSITORY="${5:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o "jsonpath={.data.${SECRET_KEY}}" \
  | base64 --decode \
  | gh secret set "$GITHUB_SECRET_NAME" --repo "$REPOSITORY"

echo "Updated ${GITHUB_SECRET_NAME} in ${REPOSITORY} from ${NAMESPACE}/${SECRET_NAME}.${SECRET_KEY}"
