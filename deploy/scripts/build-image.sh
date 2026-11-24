#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
service="${1:?Provide the service name}"
tag="${2:?Provide the image tag}"
output="${3:---load}"
args=()

case "$service" in
  frontend|kong)
    dockerfile="$service"
    ;;
  organization-service|hr-service|catalog-service|order-service)
    dockerfile=backend
    args+=(--build-arg "SERVICE=$service")
    ;;
  inventory-service|notification-service)
    dockerfile=backend
    args+=(--build-arg "SERVICE=$service" --build-arg PRISMA_CONFIG=prisma7.config.ts)
    ;;
  *)
    echo "Unknown service: $service" >&2
    exit 2
    ;;
esac

docker buildx build --platform linux/amd64 "$output" \
  -f "$root/deploy/images/$dockerfile.Dockerfile" -t "$tag" "${args[@]}" "$root"
