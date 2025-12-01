terraform {
  cloud {
    organization = "after-coders"
    workspaces {
      tags = ["after-coders-workspace"]
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "3.2.1"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  required_version = ">= 1.6.0"
}

# -----------------------
# Providers
# -----------------------
provider "aws" {
  region = var.aws_region
}

provider "aws" {
  alias  = "global"
  region = "us-east-1" # Required for CloudFront
}

# ----------------------------------------------------
# S3 Bucket for Public Assets
# ----------------------------------------------------
resource "aws_s3_bucket" "gis_docuseal_assets" {
  bucket = "${var.project_name}-assets"
}

resource "aws_s3_bucket_ownership_controls" "gis_docuseal_assets_acl" {
  bucket = aws_s3_bucket.gis_docuseal_assets.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "gis_docuseal_assets_pab" {
  bucket                  = aws_s3_bucket.gis_docuseal_assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------
# IAM Roles
# -----------------------
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "lambda_s3_assets_policy" {
  name = "${var.project_name}-lambda-s3-assets-policy"
  role = aws_iam_role.lambda_role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect   = "Allow",
      Action   = "s3:GetObject",
      Resource = "${aws_s3_bucket.gis_docuseal_assets.arn}/*"
    }]
  })
}

# -----------------------
# Build & Zip
# -----------------------
# Use absolute paths from project root
locals {
  project_root      = "${path.module}/.."
  open_next_assets  = "${local.project_root}/.open-next/assets"
  open_next_server  = "${local.project_root}/.open-next/server-functions/default"
  server_zip_output = "${local.project_root}/server-functions.zip"
  
  # Track asset changes
  asset_files = fileset(local.open_next_assets, "**/*")
  assets_hash = md5(jsonencode([for f in local.asset_files : {
    p = f
    c = filemd5("${local.open_next_assets}/${f}")
  }]))
}

# Trigger re-zip on changes
resource "null_resource" "prepare_lambda_source" {
  triggers = { always_run = timestamp() }
}

data "archive_file" "server_function_zip" {
  depends_on  = [null_resource.prepare_lambda_source]
  type        = "zip"
  source_dir  = local.open_next_server
  output_path = local.server_zip_output
}

# -----------------------
# Main Server Lambda
# -----------------------
resource "aws_lambda_function" "gis_docuseal_server" {
  function_name    = "${var.project_name}-server"
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  role             = aws_iam_role.lambda_role.arn
  filename         = data.archive_file.server_function_zip.output_path
  source_code_hash = data.archive_file.server_function_zip.output_base64sha256
  architectures    = ["x86_64"]
  timeout          = 30
  memory_size      = 1024

  environment {
    variables = {
      NODE_ENV              = "production"
      DATABASE_URL          = var.database_url
      DIRECT_DATABASE_URL   = var.direct_database_url
      NEXTAUTH_URL          = var.nextauth_url
      NEXTAUTH_SECRET       = var.nextauth_secret
      KEYCLOAK_ID           = var.keycloak_id
      KEYCLOAK_SECRET       = var.keycloak_secret
      KEYCLOAK_ISSUER       = var.keycloak_issuer
      DOCUSEAL_API_KEY      = var.docuseal_api_key
      DOCUSEAL_URL          = var.docuseal_url
    }
  }
}

resource "aws_lambda_function_url" "gis_docuseal_server_url" {
  function_name      = aws_lambda_function.gis_docuseal_server.function_name
  authorization_type = "NONE"
}

# -----------------------
# CloudFront & S3 Assets
# -----------------------
resource "aws_cloudfront_origin_access_control" "gis_docuseal_oac" {
  name                              = "${var.project_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_s3_bucket_policy" "gis_docuseal_assets_policy" {
  depends_on = [aws_s3_bucket_public_access_block.gis_docuseal_assets_pab]
  bucket     = aws_s3_bucket.gis_docuseal_assets.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Sid    = "AllowCloudFront",
      Effect = "Allow",
      Principal = { Service = "cloudfront.amazonaws.com" },
      Action   = "s3:GetObject",
      Resource = "${aws_s3_bucket.gis_docuseal_assets.arn}/*",
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.gis_docuseal_cdn.arn }
      }
    }]
  })
}

resource "aws_s3_object" "gis_docuseal_assets_objects" {
  for_each     = { for file in local.asset_files : file => file if !endswith(file, "/") }
  bucket       = aws_s3_bucket.gis_docuseal_assets.id
  key          = each.value
  source       = "${local.open_next_assets}/${each.value}"
  etag         = filemd5("${local.open_next_assets}/${each.value}")
  content_type = lookup({
    ".js" = "application/javascript", ".css" = "text/css", ".html" = "text/html",
    ".png" = "image/png", ".jpg" = "image/jpeg", ".svg" = "image/svg+xml",
    ".woff" = "font/woff", ".woff2" = "font/woff2", ".json" = "application/json"
  }, try(regex("\\.[^.]+$", each.value), ""), "application/octet-stream")
}

data "aws_cloudfront_cache_policy" "caching_optimized" { name = "Managed-CachingOptimized" }
data "aws_cloudfront_cache_policy" "caching_disabled" { name = "Managed-CachingDisabled" }

resource "aws_cloudfront_distribution" "gis_docuseal_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "GIS DocuSeal CDN"
  default_root_object = ""

  # Origin 1: S3 Assets
  origin {
    origin_id                = "s3-gis-docuseal-assets"
    domain_name              = aws_s3_bucket.gis_docuseal_assets.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.gis_docuseal_oac.id
  }

  # Origin 2: Lambda Server
  origin {
    origin_id   = "lambda-gis-docuseal-server"
    domain_name = trimsuffix(replace(aws_lambda_function_url.gis_docuseal_server_url.function_url, "https://", ""), "/")
    custom_origin_config {
      http_port              = 443
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Behavior 1: Default (Everything else -> Lambda)
  default_cache_behavior {
    target_origin_id       = "lambda-gis-docuseal-server"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_disabled.id
    compress               = true
  }

  # Behavior 2: Static Assets (_next/static/* -> S3)
  ordered_cache_behavior {
    path_pattern           = "_next/static/*"
    target_origin_id       = "s3-gis-docuseal-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = true
  }
  
  # Behavior 3: Public Files (*.png, *.css, etc -> S3)
  ordered_cache_behavior {
    path_pattern           = "*.*" 
    target_origin_id       = "s3-gis-docuseal-assets"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id        = data.aws_cloudfront_cache_policy.caching_optimized.id
    compress               = true
  }

  restrictions { geo_restriction { restriction_type = "none" } }
  viewer_certificate { cloudfront_default_certificate = true }
}

resource "null_resource" "gis_docuseal_assets_invalidation" {
  triggers = { assets_hash = local.assets_hash }
  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.gis_docuseal_cdn.id} --paths '/*'"
  }
}
