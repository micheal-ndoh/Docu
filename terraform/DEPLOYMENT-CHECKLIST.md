# GIS-DocuSign Deployment Checklist

## Two-Stage Deployment Process

### Stage 1: Before First `terraform apply`
### Stage 2: After First `terraform apply`

---

## Stage 1: Variables to Fill BEFORE First Apply

### Step 1: Generate All Secrets

Run this script to generate all passwords and secrets:

```bash
#!/bin/bash

echo "=== Generating GIS-DocuSign Secrets ==="
echo ""

# Database passwords (16 characters)
echo "Database Passwords:"
NEXTJS_DB_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 16)
DOCUSEAL_DB_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16)

echo "nextjs_db_password      = \"$NEXTJS_DB_PASSWORD\""
echo "keycloak_db_password    = \"$KEYCLOAK_DB_PASSWORD\""
echo "docuseal_db_password    = \"$DOCUSEAL_DB_PASSWORD\""
echo "keycloak_admin_password = \"$KEYCLOAK_ADMIN_PASSWORD\""

# Application secrets (32 characters)
echo ""
echo "Application Secrets:"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 32)

echo "nextauth_secret        = \"$NEXTAUTH_SECRET\""
echo "keycloak_client_secret = \"$KEYCLOAK_CLIENT_SECRET\""
echo "keycloak_secret        = \"$KEYCLOAK_CLIENT_SECRET\"  # Same as above initially"

# Get your IP
echo ""
echo "Your IP Address:"
YOUR_IP=$(curl -s ifconfig.me)
echo "ssh_allowed_ips = [\"$YOUR_IP/32\"]"

echo ""
echo "=== Copy these values to terraform.tfvars ==="
```

### Step 2: Create SSH Key Pair

```bash
# Create SSH key in AWS
aws ec2 create-key-pair \
  --key-name gis-docusign-key \
  --query 'KeyMaterial' \
  --output text > gis-docusign-key.pem

# Set permissions
chmod 400 gis-docusign-key.pem

echo "✓ SSH key created: gis-docusign-key.pem"
```

### Step 3: Fill terraform.tfvars (Stage 1)

Create `terraform/terraform.tfvars` with these values:

```hcl
# ========================================
# Stage 1: Fill These BEFORE First Apply
# ========================================

# AWS Configuration
aws_region    = "us-east-1"              # Choose your region
environment   = "production"              # production/staging/dev
instance_type = "t3.medium"              # t3.small/medium/large
key_name      = "gis-docusign-key"       # From Step 2

# Your IP (from: curl ifconfig.me)
ssh_allowed_ips = ["YOUR_IP_HERE/32"]    # Example: ["203.0.113.45/32"]

# Database Passwords (from Step 1)
nextjs_db_password      = "PASTE_FROM_STEP_1"
keycloak_db_password    = "PASTE_FROM_STEP_1"
docuseal_db_password    = "PASTE_FROM_STEP_1"
keycloak_admin_password = "PASTE_FROM_STEP_1"

# Application Secrets (from Step 1)
nextauth_secret        = "PASTE_FROM_STEP_1"
keycloak_client_secret = "PASTE_FROM_STEP_1"
keycloak_secret        = "PASTE_FROM_STEP_1"  # Same as keycloak_client_secret

# ========================================
# Stage 1: Use PLACEHOLDERS for These
# ========================================

# These will be updated after deployment
nextauth_url     = "http://PLACEHOLDER:3000"
keycloak_id      = "gis-docusign-client"
keycloak_issuer  = "http://PLACEHOLDER:8080/realms/gis"
docuseal_api_key = "PLACEHOLDER"
```

### Step 4: First Deployment

```bash
cd terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Preview changes
terraform plan

# Deploy!
terraform apply

# Save outputs
terraform output > deployment-outputs.txt
```

---

## Stage 2: Variables to Fill AFTER First Apply

### Step 5: Get EC2 Public IP

```bash
# Get EC2 IP from Terraform output
EC2_IP=$(terraform output -raw ec2_public_ip)
echo "EC2 Public IP: $EC2_IP"

# Save for later
echo "EC2_IP=$EC2_IP" > ../ec2-info.txt
```

### Step 6: Wait for Services to Start

```bash
# Wait 3-5 minutes for all containers to start
echo "Waiting for services to start..."
sleep 180

# Check if services are running
echo "Testing services..."
curl -I http://$EC2_IP:3000  # NextJS
curl -I http://$EC2_IP:8080  # Keycloak
curl -I http://$EC2_IP:8081  # DocuSeal
```

### Step 7: Verify Keycloak Client Secret

The client secret should already be set from Stage 1, but let's verify:

```bash
# Access Keycloak admin console
echo "Keycloak Admin: http://$EC2_IP:8080/admin"
echo "Username: admin"
echo "Password: (your keycloak_admin_password from terraform.tfvars)"

# Navigate to:
# Realms → gis → Clients → gis-docusign-client → Credentials
# You should see your keycloak_client_secret
```

**Note**: The secret is already set! You don't need to get it from Keycloak because you set it during realm import.

### Step 8: Get DocuSeal API Key

```bash
# Access DocuSeal
echo "DocuSeal: http://$EC2_IP:8081"

# Steps:
# 1. Complete initial setup (create admin account)
# 2. Navigate to: Settings → API Keys
# 3. Click "Create API Key"
# 4. Copy the API key
```

### Step 9: Update terraform.tfvars (Stage 2)

Update these values in `terraform/terraform.tfvars`:

```hcl
# ========================================
# Stage 2: Update These AFTER First Apply
# ========================================

# Update with EC2 IP from Step 5
nextauth_url    = "http://YOUR_EC2_IP:3000"        # Example: "http://54.123.45.67:3000"
keycloak_issuer = "http://YOUR_EC2_IP:8080/realms/gis"  # Example: "http://54.123.45.67:8080/realms/gis"

# Update with DocuSeal API key from Step 8
docuseal_api_key = "PASTE_API_KEY_FROM_DOCUSEAL"   # Example: "ds_1234567890abcdef"

# These stay the same (no changes needed)
# keycloak_id = "gis-docusign-client"
# keycloak_secret = "..." (already set in Stage 1)
```

### Step 10: Second Deployment

```bash
# Apply updated configuration
terraform apply

# This will update environment variables in containers
```

### Step 11: Restart Containers

```bash
# SSH into EC2
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP

# Navigate to app directory
cd /home/ec2-user/gis-docusign

# Restart containers to pick up new environment variables
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f nextjs-app
```

### Step 12: Verify Everything Works

```bash
# Test NextJS
curl http://$EC2_IP:3000

# Test authentication flow
# Open in browser: http://$EC2_IP:3000
# Click "Login" - should redirect to Keycloak
# Login with Keycloak credentials
# Should redirect back to NextJS app

# Check container status
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP
docker-compose ps
```

---

## Complete Variable Checklist

### ✅ Stage 1 (Before First Apply)

| Variable | How to Get | Example |
|----------|-----------|---------|
| `aws_region` | Choose | `us-east-1` |
| `environment` | Choose | `production` |
| `instance_type` | Choose | `t3.medium` |
| `key_name` | AWS CLI | `gis-docusign-key` |
| `ssh_allowed_ips` | `curl ifconfig.me` | `["203.0.113.45/32"]` |
| `nextjs_db_password` | `openssl rand -base64 16` | `xK9mP2vLqR3nT8wY` |
| `keycloak_db_password` | `openssl rand -base64 16` | `aB3nQ7wMzX5cV2bN` |
| `docuseal_db_password` | `openssl rand -base64 16` | `pL5kR9tNmY6jH4fG` |
| `keycloak_admin_password` | `openssl rand -base64 16` | `zX8cV2bMqW4eR5tY` |
| `nextauth_secret` | `openssl rand -base64 32` | `qW4eR5tY...` |
| `keycloak_client_secret` | `openssl rand -base64 32` | `aB3cD4eF...` |
| `keycloak_secret` | Same as above | `aB3cD4eF...` |
| `nextauth_url` | Placeholder | `http://PLACEHOLDER:3000` |
| `keycloak_id` | Fixed | `gis-docusign-client` |
| `keycloak_issuer` | Placeholder | `http://PLACEHOLDER:8080/realms/gis` |
| `docuseal_api_key` | Placeholder | `PLACEHOLDER` |

### ✅ Stage 2 (After First Apply)

| Variable | How to Get | Example |
|----------|-----------|---------|
| `nextauth_url` | `terraform output ec2_public_ip` | `http://54.123.45.67:3000` |
| `keycloak_issuer` | Same as above | `http://54.123.45.67:8080/realms/gis` |
| `docuseal_api_key` | DocuSeal Settings → API Keys | `ds_1234567890abcdef` |

---

## Quick Start Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "=== GIS-DocuSign Deployment Script ==="

# Check if terraform.tfvars exists
if [ ! -f terraform/terraform.tfvars ]; then
  echo "❌ terraform.tfvars not found!"
  echo "Please create it first with Stage 1 variables"
  exit 1
fi

# Stage 1: First deployment
echo ""
echo "Stage 1: Initial Deployment"
echo "============================"
cd terraform

terraform init
terraform validate
terraform plan

read -p "Deploy infrastructure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Deployment cancelled"
  exit 0
fi

terraform apply

# Get EC2 IP
EC2_IP=$(terraform output -raw ec2_public_ip)
echo ""
echo "✓ Deployment complete!"
echo "✓ EC2 IP: $EC2_IP"
echo ""
echo "Waiting for services to start (3 minutes)..."
sleep 180

# Test services
echo ""
echo "Testing services..."
curl -I http://$EC2_IP:3000 && echo "✓ NextJS is running"
curl -I http://$EC2_IP:8080 && echo "✓ Keycloak is running"
curl -I http://$EC2_IP:8081 && echo "✓ DocuSeal is running"

echo ""
echo "=== Stage 1 Complete! ==="
echo ""
echo "Next steps:"
echo "1. Access DocuSeal: http://$EC2_IP:8081"
echo "2. Get API key from Settings → API Keys"
echo "3. Update terraform.tfvars with:"
echo "   - nextauth_url = \"http://$EC2_IP:3000\""
echo "   - keycloak_issuer = \"http://$EC2_IP:8080/realms/gis\""
echo "   - docuseal_api_key = \"YOUR_API_KEY\""
echo "4. Run: terraform apply"
echo "5. SSH and restart: docker-compose down && docker-compose up -d"
```

---

## Troubleshooting

### "SSH key not found"
```bash
# Create it first
aws ec2 create-key-pair --key-name gis-docusign-key --query 'KeyMaterial' --output text > gis-docusign-key.pem
chmod 400 gis-docusign-key.pem
```

### "Services not responding"
```bash
# SSH into EC2 and check logs
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP
docker-compose logs
```

### "OAuth error after Stage 2"
```bash
# Restart containers to pick up new environment variables
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP
cd /home/ec2-user/gis-docusign
docker-compose down && docker-compose up -d
```

---

## Summary

**Stage 1** (Before first apply):
- ✅ Generate 7 passwords/secrets
- ✅ Create SSH key
- ✅ Fill 16 variables (12 real + 4 placeholders)
- ✅ Run `terraform apply`

**Stage 2** (After first apply):
- ✅ Get EC2 IP
- ✅ Get DocuSeal API key
- ✅ Update 3 variables
- ✅ Run `terraform apply` again
- ✅ Restart containers

**Total time**: ~30-45 minutes
