output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.gis_docusign.public_ip
}

output "ec2_instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.gis_docusign.id
}

output "nextjs_url" {
  description = "URL to access NextJS application"
  value       = "http://${aws_instance.gis_docusign.public_ip}:3000"
}

output "keycloak_url" {
  description = "URL to access Keycloak admin console"
  value       = "http://${aws_instance.gis_docusign.public_ip}:8080"
}

output "keycloak_admin_url" {
  description = "URL to access Keycloak admin console"
  value       = "http://${aws_instance.gis_docusign.public_ip}:8080/admin"
}

output "docuseal_url" {
  description = "URL to access DocuSeal"
  value       = "http://${aws_instance.gis_docusign.public_ip}:8081"
}




