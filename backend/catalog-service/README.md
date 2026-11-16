# Catalog Service

Catalog owns menu categories, menu items, restaurant pricing and availability,
modifier groups, ingredients, and recipes. The frontend calls it through Kong
under `/api/catalog`. Order Service requests checkout prices and Inventory
Service retrieves recipes and ingredients through the internal Catalog API.

## Run locally

Set `DATABASE_URL` and `INTERNAL_API_KEY` in the service environment. Use the
same internal key in Order and Inventory when they call Catalog. Catalog
listens on port `3004` by default.

Set `ORGANIZATION_SERVICE_URL` to the Organization Service base URL. The
local default is `http://localhost:3001`. Docker Compose defaults to
`http://organization-service:3001` and accepts an override through
`CATALOG_ORGANIZATION_SERVICE_URL`. Catalog verifies bearer tokens and
restaurant assignments through Organization's `/catalog-access` endpoint.

Signed-in workspace users can read the shared catalog. Super admins can
edit shared items, categories, ingredients, modifiers, and recipes. Franchise
admins can manage local prices and availability across their franchise.
Restaurant admins and operations users can manage them at their assigned
restaurant. Staff can read their assigned restaurant's menu. Internal pricing,
recipe, and ingredient routes use the internal API key. The root health
endpoint is public.

```sh
npm ci
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

For production, run `npm run build` and `npm run start:prod`.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm test
npm run test:e2e
```

Set `CATALOG_TEST_DATABASE_URL` to a PostgreSQL connection with permission
to create and drop test databases. The HTTP suite uses a disposable database,
applies the migrations and checks for schema drift, then exercises menu
availability, price overrides, validation, and recipe lookup.
