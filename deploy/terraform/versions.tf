terraform {
  required_version = ">= 1.12, < 2.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.59"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Application = "FoodMatrix"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
