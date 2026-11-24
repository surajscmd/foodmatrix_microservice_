const { Kafka } = require('kafkajs');

const topics = [
  'order-complete',
  'order-complete-invalid',
  'order-complete-stock-shortage',
  'inventory.low-stock',
  'inventory.stock-in-transit',
  'inventory.stock-received',
  'inventory.stock-request-approved',
  'inventory.stock-request-created',
  'inventory.stock-shipped',
  'hr.employee-clocked-out-early',
  'hr.employee-late',
  'hr.employee-signed-in',
  'hr.leave-applied',
  'hr.leave-decision',
];

async function main() {
  const brokers = (process.env.KAFKA_BROKERS ?? '').split(',').map((broker) =>
    broker.trim()).filter(Boolean);
  const username = process.env.KAFKA_SASL_USERNAME;
  const password = process.env.KAFKA_SASL_PASSWORD;
  if (!brokers.length || Boolean(username) !== Boolean(password)) {
    throw new Error('Configure Kafka brokers and both SASL credentials when using SCRAM.');
  }

  const admin = new Kafka({
    clientId: 'foodmatrix-topic-bootstrap',
    brokers,
    ssl: Boolean(username) || process.env.KAFKA_SSL === 'true',
    ...(username && {
      sasl: { mechanism: 'scram-sha-512', username, password },
    }),
  }).admin();

  await admin.connect();
  try {
    await admin.createTopics({
      topics: topics.map((topic) => ({
        topic,
        numPartitions: Number(process.env.KAFKA_TOPIC_PARTITIONS),
        replicationFactor: Number(process.env.KAFKA_TOPIC_REPLICAS),
      })),
    });
    console.log('FoodMatrix Kafka topics are ready.');
  } finally {
    await admin.disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
