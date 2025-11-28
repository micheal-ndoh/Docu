
# =================================================================
# Rules for Existing/Default Security Group
# These rules are applied when create_security_group is false
# =================================================================

locals {
  # Determine which security group to add rules to
  target_sg_id = var.create_security_group ? "" : (var.existing_security_group_id != "" ? var.existing_security_group_id : data.aws_security_group.default.id)
}

# SSH Access
resource "aws_security_group_rule" "ssh_ingress" {
  count             = var.create_security_group ? 0 : 1
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.ssh_allowed_ips
  security_group_id = local.target_sg_id
  description       = "SSH Access"
}



# HTTPS Access
resource "aws_security_group_rule" "https_ingress" {
  count             = var.create_security_group ? 0 : 1
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = local.target_sg_id
  description       = "HTTPS Access"
}

# NextJS App
resource "aws_security_group_rule" "nextjs_ingress" {
  count             = var.create_security_group ? 0 : 1
  type              = "ingress"
  from_port         = 3000
  to_port           = 3000
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = local.target_sg_id
  description       = "NextJS App"
}

# Keycloak
resource "aws_security_group_rule" "keycloak_ingress" {
  count             = var.create_security_group ? 0 : 1
  type              = "ingress"
  from_port         = 8080
  to_port           = 8080
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = local.target_sg_id
  description       = "Keycloak"
}

# DocuSeal
resource "aws_security_group_rule" "docuseal_ingress" {
  count             = var.create_security_group ? 0 : 1
  type              = "ingress"
  from_port         = 8081
  to_port           = 8081
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = local.target_sg_id
  description       = "DocuSeal"
}
