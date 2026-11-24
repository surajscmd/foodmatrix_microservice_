#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
app="$root/helm/foodmatrix"
values=(--set imageRegistry=registry.example/foodmatrix --set imageTag=validation --set kafkaBrokers=kafka:9092)

helm lint "$app" "${values[@]}"
helm template foodmatrix "$app" --namespace foodmatrix --kube-version 1.34.0 \
  -f "$app/values-eks.example.yaml" "${values[@]}" >/dev/null

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add grafana-community https://grafana-community.github.io/helm-charts
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm repo update

render() {
  helm template "$1" "$2" --version "$3" --namespace monitoring \
    --kube-version 1.34.0 -f "$root/observability/$4" >/dev/null
}

render prometheus prometheus-community/kube-prometheus-stack 93.3.0 prometheus.yaml
render loki grafana-community/loki 21.2.3 loki.yaml
render tempo grafana-community/tempo 3.2.1 tempo.yaml
render otel-gateway open-telemetry/opentelemetry-collector 0.178.3 otel-gateway.yaml
render otel-logs open-telemetry/opentelemetry-collector 0.178.3 otel-logs.yaml
render otel-operator open-telemetry/opentelemetry-operator 0.129.0 operator.yaml
