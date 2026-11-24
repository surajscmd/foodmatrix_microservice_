import type { KafkaConfig } from 'kafkajs';

export function kafkaSecurity(): Pick<KafkaConfig, 'ssl' | 'sasl'> {
  const username = process.env.KAFKA_SASL_USERNAME;
  const password = process.env.KAFKA_SASL_PASSWORD;

  if (username || password) {
    if (!username || !password) {
      throw new Error('Both Kafka SASL credentials must be configured.');
    }
    return {
      ssl: true,
      sasl: { mechanism: 'scram-sha-512', username, password },
    };
  }

  return { ssl: process.env.KAFKA_SSL === 'true' };
}
