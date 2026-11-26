#!/usr/bin/env bash
set -euo pipefail
: "${SMOKE_BASE_URL:?Set the public staging origin}"
[[ "$SMOKE_BASE_URL" =~ ^https://[^/]+/?$ ]] || { echo 'Use an HTTPS staging origin.' >&2; exit 1; }
base="${SMOKE_BASE_URL%/}"
curl --fail --silent --show-error --retry 5 --retry-connrefused --connect-timeout 5 --max-time 20 "$base/edge-health"
curl --fail --silent --show-error --retry 5 --retry-connrefused --connect-timeout 5 --max-time 20 "$base/login" >/dev/null
for service in frontend organization-service hr-service catalog-service order-service inventory-service notification-service; do
  kubectl -n foodmatrix rollout status "deployment/$service" --timeout=120s
  ready="$(kubectl -n foodmatrix get deployment "$service" -o jsonpath='{.status.readyReplicas}')"
  [[ "${ready:-0}" -ge 1 ]] || { echo "$service has no ready replicas" >&2; exit 1; }
done
echo 'Public edge/login and all Kubernetes readiness checks passed.'
