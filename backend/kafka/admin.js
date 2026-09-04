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
      ],
    });

    console.log("Topic created successfully");
  } catch (error) {
    console.error("Kafka error:", error);
  } finally {
    await admin.disconnect();
  }
};

run();
