# AWS Configuration
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., production, staging, development)"
  type        = string
  default     = "production"
}

# EC2 Configuration
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
  
  validation {
    condition     = can(regex("^t3\\.(small|medium|large)$", var.instance_type))
    error_message = "Instance type must be t3.small, t3.medium, or t3.large"
  }
}

variable "key_name" {
  description = "Name of the SSH key pair to use for EC2 instance"
  type        = string
}

variable "ssh_allowed_ips" {
  description = "List of IP addresses allowed to SSH into the instance"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # CHANGE THIS to your IP in production!
}

variable "existing_security_group_id" {
  description = "ID of existing security group to use (if you don't have permission to create new ones)"
  type        = string
  default     = ""
}

variable "create_security_group" {
  description = "Whether to create a new security group (set to false if using existing)"
  type        = bool
  default     = true
}

# Database Passwords
variable "nextjs_db_password" {
  description = "Password for NextJS PostgreSQL database"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.nextjs_db_password) >= 5
    error_message = "Password must be at least 12 characters long"
  }
}

variable "keycloak_db_password" {
  description = "Password for Keycloak PostgreSQL database"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.keycloak_db_password) >= 5
    error_message = "Password must be at least 12 characters long"
  }
}

variable "docuseal_db_password" {
  description = "Password for DocuSeal PostgreSQL database"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.docuseal_db_password) >= 5
    error_message = "Password must be at least 12 characters long"
  }
}

variable "keycloak_admin_password" {
  description = "Password for Keycloak admin user"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.keycloak_admin_password) >= 5
    error_message = "Password must be at least 12 characters long"
  }
}

# Application Secrets
variable "nextauth_secret" {
  description = "NextAuth secret for JWT encryption"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.nextauth_secret) >= 32
    error_message = "NextAuth secret must be at least 32 characters long"
  }
}

variable "nextauth_url" {
  description = "NextAuth URL (e.g., http://your-domain.com:3000)"
  type        = string
}

variable "keycloak_id" {
  description = "Keycloak client ID"
  type        = string
}

variable "keycloak_secret" {
  description = "Keycloak client secret (for OAuth authentication)"
  type        = string
  sensitive   = true
}

variable "keycloak_client_secret" {
  description = "Keycloak client secret to set in realm import (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.keycloak_client_secret) >= 32
    error_message = "Keycloak client secret must be at least 32 characters long"
  }
}

variable "keycloak_issuer" {
  description = "Keycloak issuer URL (e.g., http://your-domain.com:8080/realms/docu)"
  type        = string
}

variable "docuseal_api_key" {
  description = "DocuSeal API key"
  type        = string
  sensitive   = true
}
