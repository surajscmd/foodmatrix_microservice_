#!/usr/bin/env bash
set -euo pipefail
for tool in node npm docker git curl jq helm terraform aws kubectl; do
  command -v "$tool" >/dev/null || { echo "Missing CI tool: $tool" >&2; exit 1; }
done
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 22 ]] || {
  echo 'Use the Node.js 22 CI agent.' >&2; exit 1;
}
docker info >/dev/null
docker buildx version
docker compose version
