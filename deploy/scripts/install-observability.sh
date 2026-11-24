#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config="$root/observability"

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add grafana-community https://grafana-community.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update

install() {
  local release="$1" chart="$2" version="$3" values="$4"
  helm upgrade --install "$release" "$chart" --version "$version" \
    --namespace monitoring --create-namespace --values "$config/$values" --wait --timeout 15m
}

kubectl apply -f "$config/storage-eks.yaml"
install prometheus prometheus-community/kube-prometheus-stack 93.3.0 prometheus.yaml
install loki grafana-community/loki 21.2.3 loki.yaml
install tempo grafana-community/tempo 3.2.1 tempo.yaml
install otel-gateway open-telemetry/opentelemetry-collector 0.178.3 otel-gateway.yaml
install otel-logs open-telemetry/opentelemetry-collector 0.178.3 otel-logs.yaml
install otel-operator open-telemetry/opentelemetry-operator 0.129.0 operator.yaml
kubectl create namespace foodmatrix --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$config/instrumentation.yaml" -f "$config/alerts.yaml"
