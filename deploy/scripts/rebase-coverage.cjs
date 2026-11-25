const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const service = process.argv[2];
if (!['organization-service', 'catalog-service', 'hr-service', 'order-service', 'inventory-service', 'notification-service'].includes(service)) {
  throw new Error('Unknown coverage service');
}
const directory = path.join(root, 'backend', service);
const file = path.join(directory, 'coverage/lcov.info');
const report = fs.readFileSync(file, 'utf8').replace(/^SF:(.+)$/gm, (_, source) => {
  const candidates = [path.resolve(directory, source), path.resolve(directory, 'src', source)];
  const resolved = candidates.find((candidate) => candidate.startsWith(directory + path.sep) && fs.existsSync(candidate));
  if (!resolved) throw new Error('Coverage source is missing: ' + source);
  return 'SF:' + path.relative(root, resolved).split(path.sep).join('/');
});
fs.writeFileSync(file, report);
