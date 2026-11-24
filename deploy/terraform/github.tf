variable "github_repository" {
  description = "GitHub owner/repository allowed to publish images. Leave null to manage publishing access separately."
  type        = string
  default     = null
}

variable "github_oidc_provider_arn" {
  description = "ARN of the account's existing GitHub Actions OIDC provider."
  type        = string
  default     = null
}

variable "deploy_role_arn" {
  description = "Optional existing IAM role for deployment from a private GitHub runner."
  type        = string
  default     = null
}

data "aws_iam_policy_document" "image_publish_trust" {
  count = var.github_repository == null ? 0 : 1

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:image-publish"]
    }
  }
}

resource "aws_iam_role" "image_publish" {
  count = var.github_repository == null ? 0 : 1

  name               = "${local.name}-image-publish"
  assume_role_policy = data.aws_iam_policy_document.image_publish_trust[0].json

  lifecycle {
    precondition {
      condition     = var.github_oidc_provider_arn != null
      error_message = "Provide github_oidc_provider_arn when enabling GitHub image publishing."
    }
  }
}

resource "aws_iam_role_policy" "image_publish" {
  count = var.github_repository == null ? 0 : 1

  role = aws_iam_role.image_publish[0].name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability", "ecr:BatchGetImage", "ecr:CompleteLayerUpload",
          "ecr:DescribeImages", "ecr:GetDownloadUrlForLayer", "ecr:InitiateLayerUpload",
          "ecr:PutImage", "ecr:UploadLayerPart",
        ]
        Resource = [for repository in aws_ecr_repository.images : repository.arn]
      },
    ]
  })
}

resource "aws_eks_access_entry" "deployer" {
  count = var.deploy_role_arn == null ? 0 : 1

  cluster_name      = module.eks.cluster_name
  principal_arn     = var.deploy_role_arn
  kubernetes_groups = ["foodmatrix-deployer"]
  type              = "STANDARD"
}

output "image_publish_role_arn" {
  value = one(aws_iam_role.image_publish[*].arn)
}
