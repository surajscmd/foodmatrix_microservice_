# Organization Service

## First deployment

1. Run `npm ci` and `npx prisma generate`.
2. Set `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and
   `BETTER_AUTH_TRUSTED_ORIGINS`. Use the public auth origin for
   `BETTER_AUTH_URL` and include the frontend origin in the trusted origins.
3. On an empty database, run `npm run db:migrate`.
4. Set `BOOTSTRAP_FRANCHISE_NAME`, `BOOTSTRAP_ADMIN_NAME`,
   `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` in your
   deployment environment. Run `npm run db:bootstrap` once. The password
   must be 12–128 characters. Remove the bootstrap password from the
   environment when the command succeeds.
5. Run `npm run build` and `npm run start:prod`. For development use
   `npm run start:dev`.

Bootstrap creates the initial franchise and super admin together in one
transaction. It stops if a super admin already exists.

## Existing databases

The baseline precedes the already published Better Auth migration. For an
existing database that already has the current schema, first verify that it
matches the schema file:

```sh
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

If the comparison reports zero differences, mark the baseline as applied,
and also mark the Better Auth migration as applied if its record is absent
from the migration history. Then deploy pending migrations:

```sh
npx prisma migrate resolve --applied 20260913072938_organization_baseline
npx prisma migrate status
# Run only if the Better Auth migration is missing from the history.
npx prisma migrate resolve --applied 20260913072939_add_better_auth
npm run db:migrate
```

Databases with legacy Region or Terminal data need a reviewed migration and
backup before applying the historical Better Auth migration. Its SQL removes
those models and requires existing restaurant data to be prepared first.

## Account and restaurant access

Deactivating a restaurant keeps its ID and history available to central
administrators, blocks assigned users from signing in, and revokes their
sessions. The existing restaurant delete endpoint also deactivates the record.
Restoring the restaurant allows assigned users with active accounts to sign in
again. HR and Catalog use `/hr-access` and `/catalog-access` respectively to
verify bearer tokens against their originating session. Both reject a token
when that session is revoked.

Operations can edit a login's role and restaurant from **Manage system logins**.
Super admins can also change its franchise. Franchise admins can edit
restaurant-level logins within their franchise. A changed assignment revokes
the user's sessions. The **Account security** section in Settings lets
signed-in users change their password and keep their current browser session.

## Password reset email

Set `PASSWORD_RESET_WEBHOOK_URL` and `PASSWORD_RESET_WEBHOOK_TOKEN` to
enable password reset email. The Organization Service posts
`{ email, resetUrl }` over HTTPS with a bearer token. The receiver sends the
email, returns a 2xx status when accepted, and keeps reset links out of logs.

## Checks

```sh
npm run lint
npx tsc --noEmit
npm test
npm run test:e2e
```

For the HTTP suite, set `ORGANIZATION_TEST_DATABASE_URL` to a PostgreSQL
connection with permission to create and drop databases. The runner creates
a uniquely named test database, applies migrations, checks for schema drift,
bootstraps the first login, and removes that database when the suite finishes.
