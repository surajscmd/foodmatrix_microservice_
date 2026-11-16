import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const connectionString = process.env.INVENTORY_TEST_DATABASE_URL;
if (!connectionString) {
  console.error(
    'Set INVENTORY_TEST_DATABASE_URL to a PostgreSQL connection that can create and drop test databases.',
  );
  process.exit(1);
}

const name = 'fmx_inventory_e2e_' + randomUUID().replaceAll('-', '');
const url = new URL(connectionString);
url.pathname = '/' + name;
url.searchParams.delete('schema');
const env = {
  ...process.env,
  DATABASE_URL: url.href,
};
const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 5_000,
});
const node = (...args) =>
  execFileSync(process.execPath, args, { env, stdio: 'inherit' });
let created = false;
try {
  await client.connect();
  await client.query(`CREATE DATABASE "${name}"`);
  created = true;
  node(
    './node_modules/prisma/build/index.js',
    'migrate',
    'deploy',
    '--config',
    'prisma7.config.ts',
  );
  node(
    './node_modules/prisma/build/index.js',
    'migrate',
    'diff',
    '--config',
    'prisma7.config.ts',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  );
  node(
    '--experimental-vm-modules',
    './node_modules/jest/bin/jest.js',
    '--config',
    './test/jest-e2e.json',
    '--runInBand',
  );
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Inventory HTTP tests failed.',
  );
  process.exitCode = 1;
} finally {
  try {
    if (created) await client.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  } finally {
    await client.end();
  }
}
