# Terraform AWS Deployment

This directory contains Terraform configuration to deploy the GIS-DocuSign application to AWS.

## Architecture

- **EC2 Instance**: t3.medium running Amazon Linux 2
- **Docker**: All services run in Docker containers
- **Volumes**: Data persisted on EC2 local disk
- **Networking**: Docker bridge network for inter-container communication
- **Security**: Security group controls external access

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** configured with credentials
3. **Terraform** installed (>= 1.0)
4. **SSH Key Pair** created in AWS

## Setup Instructions

### 1. Create SSH Key Pair

```bash
# Create key pair in AWS
aws ec2 create-key-pair \
  --key-name gis-docusign-key \
  --query 'KeyMaterial' \
  --output text > gis-docusign-key.pem

# Set permissions
chmod 400 gis-docusign-key.pem
```

### 2. Configure Variables

```bash
# Copy example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
nano terraform.tfvars
```

**Important values to change:**
- `ssh_allowed_ips`: Your IP address (get with `curl ifconfig.me`)
- All passwords: Generate strong passwords
- `nextauth_secret`: Generate with `openssl rand -base64 32`

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

```bash
terraform plan
```

Review the planned changes carefully.

### 5. Deploy

```bash
terraform apply
```

Type `yes` to confirm.

### 6. Get Outputs

```bash
terraform output
```

This will show:
- EC2 public IP
- Service URLs
- SSH command

## Post-Deployment Configuration

### 1. Update Configuration

After deployment, update `terraform.tfvars` with the EC2 IP:

```hcl
nextauth_url    = "http://YOUR_EC2_IP:3000"
keycloak_issuer = "http://YOUR_EC2_IP:8080/realms/docu"
```

Then run `terraform apply` again.

### 2. Configure Keycloak

1. Access Keycloak: `http://YOUR_EC2_IP:8080`
2. Login with admin credentials
3. Create realm "docu"
4. Create client "gis-docusign-client"
5. Get client secret
6. Update `keycloak_secret` in `terraform.tfvars`
7. Run `terraform apply` again

### 3. Configure DocuSeal

1. Access DocuSeal: `http://YOUR_EC2_IP:8081`
2. Complete setup
3. Get API key from settings
4. Update `docuseal_api_key` in `terraform.tfvars`
5. Run `terraform apply` again

### 4. Deploy Application Code

```bash
# SSH into EC2
ssh -i gis-docusign-key.pem ec2-user@YOUR_EC2_IP

# Navigate to app directory
cd /home/ec2-user/gis-docusign/app

# Clone your repository or copy files
git clone https://github.com/your-repo/gis-docusign.git .

# Restart NextJS container
docker-compose restart nextjs-app
```

## Useful Commands

### Check Deployment Status

```bash
# SSH into instance
ssh -i gis-docusign-key.pem ec2-user@$(terraform output -raw ec2_public_ip)

# Check containers
docker-compose ps

# View logs
docker-compose logs -f

# Check specific service
docker-compose logs -f nextjs-app
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart nextjs-app
```

### Update Configuration

```bash
# Edit .env file
nano /home/ec2-user/gis-docusign/.env

# Restart containers
docker-compose down && docker-compose up -d
```

## Monitoring

### View Container Logs

```bash
docker-compose logs -f
```

### Check Resource Usage

```bash
docker stats
```

### Check Disk Space

```bash
df -h
du -sh /var/lib/docker/volumes/*
```

## Backup & Recovery

### Backup Data

```bash
# Backup Docker volumes
sudo tar -czf backup-$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/

# Download backup
scp -i gis-docusign-key.pem ec2-user@YOUR_EC2_IP:~/backup-*.tar.gz .
```

### Restore Data

```bash
# Upload backup
scp -i gis-docusign-key.pem backup-*.tar.gz ec2-user@YOUR_EC2_IP:~/

# Stop containers
docker-compose down

# Restore volumes
sudo tar -xzf backup-*.tar.gz -C /

# Start containers
docker-compose up -d
```

## Troubleshooting

### Containers Not Starting

```bash
# Check logs
docker-compose logs

# Check specific container
docker logs docu-nextjs-app

# Restart
docker-compose restart
```

### Cannot Connect to Services

```bash
# Check security group
aws ec2 describe-security-groups --group-ids $(terraform output -raw security_group_id)

# Check if ports are listening
sudo netstat -tlnp | grep -E '3000|8080|8081'

# Check container health
docker-compose ps
```

### Out of Disk Space

```bash
# Clean up Docker
docker system prune -a

# Remove old logs
sudo find /var/lib/docker/containers -name "*.log" -exec truncate -s 0 {} \;
```

## Updating Infrastructure

### Change Instance Type

```hcl
# In terraform.tfvars
instance_type = "t3.large"
```

```bash
terraform apply
```

**Note**: This will recreate the instance and lose data!

### Update Security Rules

Edit `security.tf` and run:

```bash
terraform apply
```

## Destroying Infrastructure

**WARNING**: This will delete everything!

```bash
terraform destroy
```

## Cost Estimation

| Resource | Configuration | Monthly Cost |
|----------|--------------|--------------|
| EC2 t3.medium | On-Demand | ~$30 |
| EBS 50GB | gp3 | ~$4 |
| Elastic IP | Attached | $0 |
| Data Transfer | Minimal | ~$2 |
| **Total** | | **~$36/month** |

## Security Best Practices

1. ✅ Restrict SSH access to your IP only
2. ✅ Use strong passwords (min 12 characters)
3. ✅ Rotate secrets regularly
4. ✅ Enable HTTPS (use Nginx + Let's Encrypt)
5. ✅ Regular backups
6. ✅ Monitor logs for suspicious activity
7. ✅ Keep Docker images updated

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Review deployment info: `cat /home/ec2-user/deployment-info.txt`
3. Check AWS Console for EC2 status
4. Verify security group rules

## Files

- `main.tf`: Main infrastructure configuration
- `variables.tf`: Input variables
- `outputs.tf`: Output values
- `security.tf`: Security group rules
- `user-data.sh`: EC2 initialization script
- `terraform.tfvars.example`: Example configuration
- `.gitignore`: Git ignore rules
