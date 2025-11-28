terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Uncomment and configure after creating S3 bucket for state
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "gis-docusign/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
  

}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Use default VPC (or create new one)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Get default security group if not creating a new one
data "aws_security_group" "default" {
  vpc_id = data.aws_vpc.default.id
  
  filter {
    name   = "group-name"
    values = ["default"]
  }
}

# EC2 Instance
resource "aws_instance" "gis_docusign" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = var.instance_type
  
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = var.create_security_group ? [aws_security_group.gis_docusign[0].id] : (var.existing_security_group_id != "" ? [var.existing_security_group_id] : [data.aws_security_group.default.id])
  associate_public_ip_address = true
  # Use the key pair we created
  # key_name = aws_key_pair.kp.key_name
  
  user_data = templatefile("${path.module}/user-data.sh", {
    nextjs_db_password      = var.nextjs_db_password
    keycloak_db_password    = var.keycloak_db_password
    docuseal_db_password    = var.docuseal_db_password
    keycloak_admin_password = var.keycloak_admin_password
    keycloak_client_secret  = var.keycloak_client_secret
    nextauth_secret         = var.nextauth_secret
    nextauth_url            = var.nextauth_url
    keycloak_id             = var.keycloak_id
    keycloak_secret         = var.keycloak_secret
    keycloak_issuer         = var.keycloak_issuer
    docuseal_api_key        = var.docuseal_api_key
  })
  
  root_block_device {
    volume_size = 50  # 50GB for OS + Docker volumes
    volume_type = "gp3"
    encrypted   = true
  }
  
  lifecycle {
    create_before_destroy = true
  }
}
