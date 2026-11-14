import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "kafka-service",
  brokers: ["localhost:9094", "localhost:9095", "localhost:9096"],
});

const admin = kafka.admin();

const run = async () => {
  try {
    await admin.connect();

    await admin.createTopics({
      topics: [
        {
          topic: "order-complete",
          numPartitions: 3,
          replicationFactor: 3,
        },
        {
          topic: "order-complete-stock-shortage",
          numPartitions: 3,
          replicationFactor: 3,
        },
      ],
    });

    console.log("Order topics are ready");
  } catch (error) {
    console.error("Kafka error:", error);
    process.exitCode = 1;
  } finally {
    await admin.disconnect();
  }
};

run();
