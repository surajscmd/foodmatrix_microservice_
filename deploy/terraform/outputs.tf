output "cluster_name" {
  value = module.eks.cluster_name
}

output "image_registry" {
  value = trimsuffix(aws_ecr_repository.images["frontend"].repository_url, "/frontend")
}

output "postgres_endpoint" {
  value = aws_db_instance.postgres.address
}

output "postgres_admin_secret_arn" {
  value = aws_db_instance.postgres.master_user_secret[0].secret_arn
}

output "kafka_brokers" {
  value = one(aws_msk_cluster.kafka[*].bootstrap_brokers_sasl_scram)
}
