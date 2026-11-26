variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "environment" {
  type    = string
  default = "staging"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,15}$", var.environment))
    error_message = "Use a short lowercase environment name."
  }
}

variable "kubernetes_version" {
  type    = string
  default = "1.34"
}

variable "operator_cidrs" {
  description = "Public CIDRs permitted to reach the EKS Kubernetes API."
  type        = list(string)

  validation {
    condition = length(var.operator_cidrs) > 0 && alltrue([
      for cidr in var.operator_cidrs : can(cidrnetmask(cidr)) && cidr != "0.0.0.0/0"
    ])
    error_message = "Provide at least one restricted IPv4 CIDR."
  }
}

variable "database_instance_class" {
  type    = string
  default = "db.t4g.small"
}

variable "database_allocated_storage" {
  type    = number
  default = 30
}

variable "database_backup_retention_period" {
  type    = number
  default = 7
}

variable "database_skip_final_snapshot" {
  type    = bool
  default = false
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "protect_database" {
  type    = bool
  default = true
}

variable "kafka_scram_secret_arn" {
  description = "Existing customer-KMS-encrypted AmazonMSK_ Secrets Manager secret. Set to provision a private MSK cluster."
  type        = string
  default     = null
}

variable "kafka_version" {
  type    = string
  default = "3.9.x"
}
