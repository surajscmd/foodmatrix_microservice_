#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$root"
# Only disposable test credentials enter this process. Never inject production DB secrets.
password="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(24).toString("hex"))')"
container="foodmatrix-ci-$(node -e 'process.stdout.write(require("node:crypto").randomBytes(8).toString("hex"))')"
state="$(mktemp -d)"
cleanup() {
  docker rm -fv "$container" >/dev/null 2>&1 || true
  rm -rf "$state"
}
trap cleanup EXIT
printf 'POSTGRES_PASSWORD=%s\n' "$password" > "$state/postgres.env"
db_host="127.0.0.1"
docker_net_args=(--publish 127.0.0.1::5432)
if [[ -f /.dockerenv ]]; then
  self_net="$(docker inspect -f '{{range $k,$v := .NetworkSettings.Networks}}{{println $k}}{{end}}' "$(hostname)" 2>/dev/null | awk 'NF{print;exit}')"
  if [[ -n "$self_net" && "$self_net" != "host" && "$self_net" != "none" ]]; then
    db_host="$container"
    docker_net_args=(--network "$self_net")
  fi
fi
docker run -d --name "$container" --env-file "$state/postgres.env" \
  "${docker_net_args[@]}" postgres:17-alpine >/dev/null
ready=false
for attempt in {1..60}; do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]] || { echo 'Disposable test PostgreSQL did not start.' >&2; exit 1; }
if [[ "$db_host" == "127.0.0.1" ]]; then
  port="$(docker port "$container" 5432/tcp | head -n 1 | awk -F: '{print $NF}')"
else
  port=5432
fi
export DATABASE_URL="postgresql://postgres:$password@$db_host:$port/postgres"
export ORGANIZATION_TEST_DATABASE_URL="$DATABASE_URL" CATALOG_TEST_DATABASE_URL="$DATABASE_URL"
export ORDER_TEST_DATABASE_URL="$DATABASE_URL" INVENTORY_TEST_DATABASE_URL="$DATABASE_URL"
export NOTIFICATION_TEST_DATABASE_URL="$DATABASE_URL"
export BETTER_AUTH_SECRET="$password" INTERNAL_API_KEY="$password"
for service in organization-service catalog-service hr-service order-service inventory-service notification-service; do
  (
    cd "$root/backend/$service"
    npm ci
    config=prisma.config.ts
    if [[ "$service" == inventory-service || "$service" == notification-service ]]; then config=prisma7.config.ts; fi
    npx prisma generate --config "$config"
    npx eslint 'src/**/*.ts' 'test/**/*.ts'
    npx tsc --noEmit
    npm test -- --runInBand --coverage --coverageReporters=lcov --coverageReporters=text-summary --json --outputFile=coverage/unit-results.json
    node "$root/deploy/scripts/rebase-coverage.cjs" "$service"
    npm run test:e2e
    npm run build
  )
done
(
  cd "$root/frontend"
  npm ci
  npx next typegen
  npm run lint
  npx tsc --noEmit
  npm run build -- --webpack
)
