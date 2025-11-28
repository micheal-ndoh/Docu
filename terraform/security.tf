# Security Group for EC2 Instance
resource "aws_security_group" "gis_docusign" {
  count = var.create_security_group ? 1 : 0
  
  name        = "gis-docusign-sg"
  description = "Security group for GIS-DocuSign EC2 instance"
  vpc_id      = data.aws_vpc.default.id
  
  # SSH access (restrict to your IP in production)
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_ips
  }
  
  # HTTP
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # HTTPS
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # NextJS Application
  ingress {
    description = "NextJS App"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Keycloak
  ingress {
    description = "Keycloak"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # DocuSeal
  ingress {
    description = "DocuSeal"
    from_port   = 8081
    to_port     = 8081
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # PostgreSQL (for debugging only - remove in production)
  ingress {
    description = "PostgreSQL NextJS"
    from_port   = 5433
    to_port     = 5433
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_ips  # Restrict to your IP
  }
  
  ingress {
    description = "PostgreSQL Keycloak"
    from_port   = 5434
    to_port     = 5434
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_ips
  }
  
  ingress {
    description = "PostgreSQL DocuSeal"
    from_port   = 5435
    to_port     = 5435
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_ips
  }
  
  # Outbound - allow all
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "gis-docusign-sg"
  }
}
