# ECR Repository for NextJS App
resource "aws_ecr_repository" "nextjs" {
  name                 = "gis-docusign/nextjs"
  image_tag_mutability = "MUTABLE"
  
  image_scanning_configuration {
    scan_on_push = true
  }
  
  tags = {
    Name = "gis-docusign-nextjs"
  }
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "nextjs" {
  repository = aws_ecr_repository.nextjs.name
  
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = 10
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# IAM Role for EC2 to pull from ECR
resource "aws_iam_role" "ec2_ecr" {
  name = "gis-docusign-ec2-ecr-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for ECR access
resource "aws_iam_role_policy" "ec2_ecr" {
  name = "gis-docusign-ec2-ecr-policy"
  role = aws_iam_role.ec2_ecr.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ]
      Resource = "*"
    }]
  })
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2" {
  name = "gis-docusign-ec2-profile"
  role = aws_iam_role.ec2_ecr.name
}
