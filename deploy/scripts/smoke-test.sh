#!/usr/bin/env bash
set -euo pipefail
: "${SMOKE_BASE_URL:?Set the public staging origin}"
[[ "$SMOKE_BASE_URL" =~ ^https://[^/]+/?$ ]] || { echo 'Use an HTTPS staging origin.' >&2; exit 1; }
base="${SMOKE_BASE_URL%/}"
curl --fail --silent --show-error --retry 5 --retry-connrefused --connect-timeout 5 --max-time 20 "$base/edge-health"
curl --fail --silent --show-error --retry 5 --retry-connrefused --connect-timeout 5 --max-time 20 "$base/login" >/dev/null
# BFF domain APIs intentionally require authentication. Probe private services in-cluster.
for service in organization-service hr-service catalog-service order-service inventory-service notification-service; do
  kubectl -n foodmatrix exec "deployment/$service" -c "$service" -- node -e \
    'fetch("http://127.0.0.1:"+process.env.PORT+"/health/ready", {signal: AbortSignal.timeout(5000)}).then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))'
done
echo 'Public edge/login and all six database readiness checks passed.'
