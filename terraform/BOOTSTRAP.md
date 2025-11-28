# GIS-DocuSign Deployment Bootstrap Guide

## The Chicken-and-Egg Problem

You need some values **BEFORE** deployment (passwords, keys) and some values **AFTER** deployment (EC2 IP, Keycloak secrets, DocuSeal API key).

## Solution: Two-Stage Deployment

### Stage 1: Initial Deployment (Bootstrap)
### Stage 2: Configuration & Update

---

## Stage 1: Initial Deployment

### Step 1: Generate Secrets

```bash
# Generate database passwords
NEXTJS_DB_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 16)
DOCUSEAL_DB_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16)

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Save these somewhere safe!
echo "NEXTJS_DB_PASSWORD=$NEXTJS_DB_PASSWORD"
echo "KEYCLOAK_DB_PASSWORD=$KEYCLOAK_DB_PASSWORD"
echo "DOCUSEAL_DB_PASSWORD=$DOCUSEAL_DB_PASSWORD"
echo "KEYCLOAK_ADMIN_PASSWORD=$KEYCLOAK_ADMIN_PASSWORD"
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
```

### Step 2: Create SSH Key Pair

```bash
# Create key pair in AWS
aws ec2 create-key-pair \
  --key-name gis-docusign-key \
  --query 'KeyMaterial' \
  --output text > gis-docusign-key.pem

# Set permissions
chmod 400 gis-docusign-key.pem
```

### Step 3: Create Initial terraform.tfvars

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
# ========================================
# AWS Configuration
# ========================================
aws_region    = "us-east-1"
environment   = "production"
instance_type = "t3.medium"
key_name      = "gis-docusign-key"

# Get your IP: curl ifconfig.me
ssh_allowed_ips = ["YOUR_IP/32"]

# ========================================
# Database Passwords (from Step 1)
# ========================================
nextjs_db_password      = "paste-from-step-1"
keycloak_db_password    = "paste-from-step-1"
docuseal_db_password    = "paste-from-step-1"
keycloak_admin_password = "paste-from-step-1"

# ========================================
# Application Secrets
# ========================================
nextauth_secret = "paste-from-step-1"

# PLACEHOLDER VALUES - Will update in Stage 2
nextauth_url    = "http://PLACEHOLDER:3000"
keycloak_id     = "gis-docusign-client"
keycloak_secret = "PLACEHOLDER_will_get_from_keycloak"
keycloak_issuer = "http://PLACEHOLDER:8080/realms/gis"
docuseal_api_key = "PLACEHOLDER_will_get_from_docuseal"
```

### Step 4: Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Deploy (this takes ~5 minutes)
terraform apply

# Save the outputs
terraform output > deployment-info.txt
```

### Step 5: Get EC2 IP Address

```bash
# Get EC2 public IP
EC2_IP=$(terraform output -raw ec2_public_ip)
echo "EC2 IP: $EC2_IP"

# Save this!
echo "EC2_IP=$EC2_IP" >> ../deployment-vars.txt
```

---

## Stage 2: Configuration & Update

### Step 6: Wait for Services to Start

```bash
# Wait 2-3 minutes for Docker containers to start
sleep 180

# Check if services are running
curl http://$EC2_IP:3000  # Should return HTML
curl http://$EC2_IP:8080  # Should return HTML
curl http://$EC2_IP:8081  # Should return HTML
```

### Step 7: Configure Keycloak

1. **Access Keycloak Admin Console**
   ```
   URL: http://YOUR_EC2_IP:8080/admin
   Username: admin
   Password: (your keycloak_admin_password)
   ```

2. **Create Realm**
   - Click "Create Realm"
   - Name: `gis`
   - Click "Create"

3. **Create Client**
   - Go to "Clients" → "Create client"
   - Client ID: `gis-docusign-client`
   - Client Protocol: `openid-connect`
   - Click "Next"
   
4. **Configure Client**
   - Client authentication: `ON`
   - Authorization: `OFF`
   - Authentication flow: Check all
   - Click "Next"
   
5. **Set Valid Redirect URIs**
   ```
   http://YOUR_EC2_IP:3000/*
   http://YOUR_EC2_IP:3000/api/auth/callback/keycloak
   ```
   - Click "Save"

6. **Get Client Secret**
   - Go to "Credentials" tab
   - Copy the "Client secret"
   - Save it: `KEYCLOAK_SECRET=paste-here`

### Step 8: Configure DocuSeal

1. **Access DocuSeal**
   ```
   URL: http://YOUR_EC2_IP:8081
   ```

2. **Complete Setup**
   - Create admin account
   - Complete onboarding

3. **Get API Key**
   - Go to Settings → API Keys
   - Create new API key
   - Copy the key
   - Save it: `DOCUSEAL_API_KEY=paste-here`

### Step 9: Update terraform.tfvars

Edit `terraform/terraform.tfvars` with the real values:

```hcl
# Update these with real values
nextauth_url    = "http://YOUR_EC2_IP:3000"
keycloak_secret = "paste-from-step-7"
keycloak_issuer = "http://YOUR_EC2_IP:8080/realms/gis"
docuseal_api_key = "paste-from-step-8"
```

### Step 10: Re-deploy with Updated Config

```bash
# Apply updated configuration
terraform apply

# This will update the environment variables in containers
```

### Step 11: Restart Containers with New Config

```bash
# SSH into EC2
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP

# Navigate to app directory
cd /home/ec2-user/gis-docusign

# Restart containers to pick up new environment variables
docker-compose down
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## Stage 3: Deploy Application Code

### Step 12: Deploy Your Application

```bash
# SSH into EC2 (if not already)
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP

# Navigate to app directory
cd /home/ec2-user/gis-docusign/app

# Option 1: Clone from Git
git clone https://github.com/your-repo/gis-docusign.git .

# Option 2: Copy files via SCP (from your local machine)
# scp -i gis-docusign-key.pem -r ./src ./package.json ./prisma ec2-user@$EC2_IP:/home/ec2-user/gis-docusign/app/

# Install dependencies and build
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Restart NextJS container
docker-compose restart nextjs-app
```

### Step 13: Verify Deployment

```bash
# Check all services
curl http://$EC2_IP:3000      # NextJS
curl http://$EC2_IP:8080      # Keycloak
curl http://$EC2_IP:8081      # DocuSeal

# Check container status
docker-compose ps

# Check logs
docker-compose logs nextjs-app
```

---

## Quick Reference: All Variables

### Variables You Generate (Stage 1)

| Variable | How to Generate | Example |
|----------|----------------|---------|
| `nextjs_db_password` | `openssl rand -base64 16` | `xK9mP2vL...` |
| `keycloak_db_password` | `openssl rand -base64 16` | `aB3nQ7wM...` |
| `docuseal_db_password` | `openssl rand -base64 16` | `pL5kR9tN...` |
| `keycloak_admin_password` | `openssl rand -base64 16` | `zX8cV2bM...` |
| `nextauth_secret` | `openssl rand -base64 32` | `qW4eR5tY...` |
| `key_name` | AWS Console | `gis-docusign-key` |
| `ssh_allowed_ips` | `curl ifconfig.me` | `203.0.113.1/32` |

### Variables You Get After Deployment (Stage 2)

| Variable | Where to Get | When |
|----------|-------------|------|
| `nextauth_url` | `terraform output ec2_public_ip` | After `terraform apply` |
| `keycloak_issuer` | Same EC2 IP | After `terraform apply` |
| `keycloak_secret` | Keycloak Admin Console | After Keycloak setup |
| `docuseal_api_key` | DocuSeal Settings | After DocuSeal setup |

---

## Troubleshooting

### Services Not Starting

```bash
# SSH into EC2
ssh -i gis-docusign-key.pem ec2-user@$EC2_IP

# Check user-data script logs
sudo cat /var/log/cloud-init-output.log

# Check Docker
docker ps -a
docker-compose logs
```

### Cannot Access Services

```bash
# Check security group
aws ec2 describe-security-groups --group-ids $(terraform output -raw security_group_id)

# Check if ports are open
sudo netstat -tlnp | grep -E '3000|8080|8081'
```

### Forgot a Password

```bash
# Regenerate and update
NEW_PASSWORD=$(openssl rand -base64 16)
echo "New password: $NEW_PASSWORD"

# Update terraform.tfvars
# Run: terraform apply
# Restart containers
```

---

## Complete Deployment Checklist

- [ ] Generate all passwords and secrets
- [ ] Create AWS SSH key pair
- [ ] Create `terraform.tfvars` with placeholders
- [ ] Run `terraform init`
- [ ] Run `terraform apply` (Stage 1)
- [ ] Save EC2 IP address
- [ ] Wait for services to start (2-3 min)
- [ ] Configure Keycloak realm and client
- [ ] Get Keycloak client secret
- [ ] Configure DocuSeal
- [ ] Get DocuSeal API key
- [ ] Update `terraform.tfvars` with real values
- [ ] Run `terraform apply` again (Stage 2)
- [ ] SSH into EC2
- [ ] Restart containers
- [ ] Deploy application code
- [ ] Test all services
- [ ] Configure DNS (optional)
- [ ] Set up SSL (optional)

---

## Time Estimate

- **Stage 1 (Initial Deployment)**: 10-15 minutes
- **Stage 2 (Configuration)**: 15-20 minutes
- **Stage 3 (App Deployment)**: 10-15 minutes
- **Total**: ~45 minutes

---

## Next Steps After Deployment

1. **Set up DNS**: Point your domain to EC2 IP
2. **Enable HTTPS**: Use Nginx + Let's Encrypt
3. **Set up monitoring**: CloudWatch alarms
4. **Configure backups**: Automated snapshots
5. **Update Keycloak URLs**: Use domain instead of IP

---

## Support

If you encounter issues:
1. Check `/var/log/cloud-init-output.log` on EC2
2. Check `docker-compose logs`
3. Verify security group rules
4. Ensure all passwords are correct in `.env` file
