resource "aws_security_group" "kafka" {
  count = var.kafka_scram_secret_arn == null ? 0 : 1

  name_prefix = "${local.name}-kafka-"
  description = "Kafka SASL/TLS from EKS private subnets"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "kafka" {
  for_each = var.kafka_scram_secret_arn == null ? toset([]) : toset(local.private_cidrs)

  security_group_id = aws_security_group.kafka[0].id
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 9096
  to_port           = 9096
}

resource "aws_msk_cluster" "kafka" {
  count = var.kafka_scram_secret_arn == null ? 0 : 1

  cluster_name           = local.name
  kafka_version          = var.kafka_version
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.large"
    client_subnets  = module.vpc.private_subnets
    security_groups = [aws_security_group.kafka[0].id]

    storage_info {
      ebs_storage_info {
        volume_size = 100
      }
    }
  }

  client_authentication {
    sasl {
      scram = true
    }
  }

  encryption_info {
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }
}

resource "aws_msk_scram_secret_association" "kafka" {
  count = var.kafka_scram_secret_arn == null ? 0 : 1

  cluster_arn     = aws_msk_cluster.kafka[0].arn
  secret_arn_list = [var.kafka_scram_secret_arn]
}
