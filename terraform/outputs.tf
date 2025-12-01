output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.gis_docuseal_cdn.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.gis_docuseal_cdn.id
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.gis_docuseal_server.function_name
}

output "lambda_function_url" {
  description = "Lambda function URL (direct access)"
  value       = aws_lambda_function_url.gis_docuseal_server_url.function_url
}

output "s3_bucket_name" {
  description = "S3 bucket name for assets"
  value       = aws_s3_bucket.gis_docuseal_assets.id
}
