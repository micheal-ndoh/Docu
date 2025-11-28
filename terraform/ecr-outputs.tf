output "ecr_repository_url" {
  description = "URL of the ECR repository for NextJS app"
  value       = aws_ecr_repository.nextjs.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.nextjs.name
}
