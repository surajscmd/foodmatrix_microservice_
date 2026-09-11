                    HR SERVICE
                        │
              ┌─────────┴─────────┐
              │                   │
        Attendance              Leave
              │                   │
              ▼                   ▼
       Kafka Producer      Kafka Producer
              │                   │
              └─────────┬─────────┘
                        │
                        ▼
                   Kafka Cluster
                        │
                        ▼
              Notification Service
                        │
               KafkaConsumerService
                        │
       ┌────────────────┼────────────────┐
       ▼                ▼                ▼
 signed-in             late          early-clockout
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
                  Notification DB

                         +
                        
                    leave-applied
                         │
                         ▼
                  LeaveAppliedHandler
                         │
                         ▼
                  Notification DB