#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
: "${IMAGE_REGISTRY:?Set the container repository prefix}"
: "${IMAGE_TAG:?Set the image tag to the published Git SHA}"
: "${KAFKA_BROKERS:?Set the private Kafka bootstrap brokers}"
: "${VALUES_FILE:?Set the environment Helm values file path}"

helm upgrade --install foodmatrix "$root/helm/foodmatrix" \
  --namespace foodmatrix --values "$VALUES_FILE" \
  --set-string "imageRegistry=$IMAGE_REGISTRY" \
  --set-string "imageTag=$IMAGE_TAG" \
  --set-json "kafkaBrokers=$(jq -cn --arg brokers "$KAFKA_BROKERS" '$brokers')" \
  --atomic --timeout 20m
kubectl -n foodmatrix get deployments,services
