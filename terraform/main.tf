terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.70"
    }
  }
  required_version = ">= 1.0"
}

# -----------------------
# Providers
# -----------------------
provider "aws" {
  region = var.aws_region
}

# ECR Repository
resource "aws_ecr_repository" "main" {
  name                 = var.project_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Push Docker image to ECR
locals {
  repo_url = aws_ecr_repository.main.repository_url
}

data "archive_file" "source" {
  type        = "zip"
  source_dir  = ".."
  output_path = "/tmp/source.zip"
  excludes = [
    ".terraform",
    ".git",
    "node_modules",
    ".next"
  ]
}

data "external" "git_commit" {
  program = ["bash", "-c", "echo '{\"commit_hash\":\"'$(git rev-parse HEAD)'\"}'"]
}

resource "null_resource" "docker_push" {
  depends_on = [aws_ecr_repository.main]

  triggers = {
    source_code_hash = data.archive_file.source.output_sha
    commit_hash      = data.external.git_commit.result.commit_hash
  }

  provisioner "local-exec" {
    command = <<EOT
      aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${local.repo_url}
      cd ..
      docker build -t ${local.repo_url}:${data.external.git_commit.result.commit_hash} .
      docker push ${local.repo_url}:${data.external.git_commit.result.commit_hash}
      cd terraform
    EOT
  }
}


# Lambda from ECR image + Function URL

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "${var.project_name}-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function using ECR image
resource "aws_lambda_function" "web" {
  function_name = var.project_name
  role          = aws_iam_role.lambda_execution.arn
  package_type  = "Image"
  image_uri     = "${local.repo_url}:${data.external.git_commit.result.commit_hash}"
  architectures = ["x86_64"]
  timeout       = 30
  memory_size   = 1024

  environment {
    variables = {
      DATABASE_URL        = var.database_url
      DIRECT_DATABASE_URL = var.direct_database_url
      NEXTAUTH_URL        = var.nextauth_url
      NEXTAUTH_SECRET     = var.nextauth_secret
      KEYCLOAK_ID         = var.keycloak_id
      KEYCLOAK_SECRET     = var.keycloak_secret
      KEYCLOAK_ISSUER     = var.keycloak_issuer
      DOCUSEAL_API_KEY    = var.docuseal_api_key
      DOCUSEAL_URL        = var.docuseal_url
      ADMIN_NAME          = var.admin_name
      ADMIN_EMAIL         = var.admin_email
      PORT                = "3000"
      RUST_LOG            = "info"
      AWS_LWA_INVOKE_MODE = "buffered"
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_basic, null_resource.docker_push]
}

resource "aws_lambda_function_url" "web" {
  function_name      = aws_lambda_function.web.function_name
  authorization_type = "NONE"
  invoke_mode        = "BUFFERED"
  cors {
    allow_credentials = false
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    allow_headers     = ["*"]
  }
}


resource "aws_cloudfront_invalidation" "invalidation" {
  distribution_id = aws_cloudfront_distribution.s3_distribution.id
  paths           = ["/*"]

  triggers = {
    lambda_image = aws_lambda_function.web.image_uri
  }
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name = trimsuffix(trimprefix(aws_lambda_function_url.web.function_url, "https://"), "/")
    origin_id   = "LambdaFunctionURL"
    origin_path = "" # No specific path needed for Lambda Function URL
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for GIS DocuSeal Lambda Function URL"
  default_root_object = "" # Lambda Function URL handles routing

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "LambdaFunctionURL"
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Origin", "User-Agent", "Referer"] # Forward necessary headers
      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }


  tags = {
    Name = "${var.project_name}-cloudfront-distribution"
  }
}

