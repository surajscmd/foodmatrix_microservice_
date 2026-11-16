import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';

const dbUrl = process.env.ORGANIZATION_TEST_DATABASE_URL;
if (!dbUrl) {
  console.error(
    'Set ORGANIZATION_TEST_DATABASE_URL to a PostgreSQL connection with permission to create disposable databases.',
  );
  process.exit(1);
}

const name = 'fmx_org_e2e_' + randomUUID().replaceAll('-', '');
const testUrl = new URL(dbUrl);
testUrl.pathname = '/' + name;
testUrl.searchParams.delete('schema');
const client = new pg.Client({
  connectionString: dbUrl,
  connectionTimeoutMillis: 5_000,
});
const env = {
  ...process.env,
  DATABASE_URL: testUrl.href,
  BETTER_AUTH_SECRET: randomBytes(32).toString('hex'),
  BETTER_AUTH_URL: 'http://127.0.0.1',
  BETTER_AUTH_TRUSTED_ORIGINS: 'http://127.0.0.1',
  PASSWORD_RESET_WEBHOOK_URL: '',
  PASSWORD_RESET_WEBHOOK_TOKEN: '',
  BOOTSTRAP_FRANCHISE_NAME: 'Test Franchise',
  BOOTSTRAP_ADMIN_NAME: 'Test Administrator',
  BOOTSTRAP_ADMIN_EMAIL: 'admin@example.test',
  BOOTSTRAP_ADMIN_PASSWORD: randomBytes(24).toString('base64url'),
};
const node = (...args) =>
  execFileSync(process.execPath, args, { env, stdio: 'inherit' });

let created = false;
try {
  await client.connect();
  await client.query(`CREATE DATABASE "${name}"`);
  created = true;
  node('./node_modules/prisma/build/index.js', 'migrate', 'deploy');
  node(
    './node_modules/prisma/build/index.js',
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  );
  node('./node_modules/tsx/dist/cli.mjs', 'prisma/bootstrap-admin.ts');
  node(
    '--experimental-vm-modules',
    './node_modules/jest/bin/jest.js',
    '--config',
    './test/jest-e2e.json',
    '--runInBand',
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Organization HTTP tests failed.',
  );
  process.exitCode = 1;
} finally {
  try {
    if (created) await client.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await client.end();
  }
}
