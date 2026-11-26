data "aws_availability_zones" "available" {
  state = "available"

  filter {
    name   = "opt-in-status"
    values = ["opt-in-not-required"]
  }
}

locals {
  name          = "foodmatrix-${var.environment}"
  azs           = slice(data.aws_availability_zones.available.names, 0, 3)
  private_cidrs = ["10.40.16.0/20", "10.40.32.0/20", "10.40.48.0/20"]
  images = toset([
    "frontend", "kong", "organization-service", "hr-service", "catalog-service",
    "order-service", "inventory-service", "notification-service",
  ])
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.0.1"

  name            = local.name
  cidr            = "10.40.0.0/16"
  azs             = local.azs
  public_subnets  = ["10.40.0.0/24", "10.40.1.0/24", "10.40.2.0/24"]
  private_subnets = local.private_cidrs

  enable_nat_gateway = true
  single_nat_gateway = !var.multi_az

  public_subnet_tags  = { "kubernetes.io/role/elb" = "1" }
  private_subnet_tags = { "kubernetes.io/role/internal-elb" = "1" }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "21.26.0"

  name                         = local.name
  kubernetes_version           = var.kubernetes_version
  endpoint_public_access       = true
  endpoint_public_access_cidrs = var.operator_cidrs

  enable_cluster_creator_admin_permissions = true
  compute_config = {
    enabled    = true
    node_pools = ["general-purpose", "system"]
  }

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
}

resource "aws_security_group" "database" {
  name_prefix = "${local.name}-db-"
  description = "PostgreSQL from the EKS private subnets"
  vpc_id      = module.vpc.vpc_id
}

resource "aws_vpc_security_group_ingress_rule" "postgres" {
  for_each = toset(local.private_cidrs)

  security_group_id = aws_security_group.database.id
  cidr_ipv4         = each.value
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
}

resource "aws_db_subnet_group" "database" {
  name       = local.name
  subnet_ids = module.vpc.private_subnets
}

resource "aws_db_instance" "postgres" {
  identifier                  = local.name
  engine                      = "postgres"
  engine_version              = "17"
  instance_class              = var.database_instance_class
  storage_type                = "gp3"
  allocated_storage           = var.database_allocated_storage
  max_allocated_storage       = 200
  storage_encrypted           = true
  username                    = "matrixadmin"
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.database.name
  vpc_security_group_ids      = [aws_security_group.database.id]
  publicly_accessible         = false
  multi_az                    = var.multi_az
  backup_retention_period     = var.database_backup_retention_period
  deletion_protection         = var.protect_database
  skip_final_snapshot         = var.database_skip_final_snapshot
  final_snapshot_identifier   = var.database_skip_final_snapshot ? null : "${local.name}-final"
}

resource "aws_ecr_repository" "images" {
  for_each = local.images

  name                 = "foodmatrix/${each.key}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
