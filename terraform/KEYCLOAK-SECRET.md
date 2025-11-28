# GIS-DocuSign Keycloak Client Secret Configuration

## Overview

The Keycloak client secret is now a **Terraform variable** that you generate yourself, providing better security than a hardcoded value.

## How It Works

### Two Secrets to Understand

1. **`keycloak_client_secret`** - Set during realm import (Terraform variable)
2. **`keycloak_secret`** - Used by NextJS for OAuth (initially same as above)

## Step-by-Step Setup

### 1. Generate the Client Secret

```bash
# Generate a strong random secret
openssl rand -base64 32

# Example output:
# qW4eR5tYuI8oP0aS2dF3gH6jK9lZ1xC4vB7nM5mQ8wE=
```

### 2. Add to terraform.tfvars

```hcl
# Client secret for Keycloak realm import
keycloak_client_secret = "qW4eR5tYuI8oP0aS2dF3gH6jK9lZ1xC4vB7nM5mQ8wE="

# OAuth client secret (same value initially)
keycloak_secret = "qW4eR5tYuI8oP0aS2dF3gH6jK9lZ1xC4vB7nM5mQ8wE="
```

### 3. Deploy

```bash
terraform apply
```

**What happens**:
- Terraform passes `keycloak_client_secret` to user-data script
- User-data script creates realm JSON with your secret
- Keycloak imports realm with your secret
- NextJS uses `keycloak_secret` (same value) for OAuth

### 4. Verify (Optional)

After deployment, you can verify the secret in Keycloak:

```bash
# Access Keycloak admin console
http://YOUR_EC2_IP:8080/admin

# Navigate to:
Realms → gis → Clients → gis-docusign-client → Credentials

# You should see your secret
```

## Complete terraform.tfvars Example

```hcl
# ========================================
# AWS Configuration
# ========================================
aws_region    = "us-east-1"
environment   = "production"
instance_type = "t3.medium"
key_name      = "gis-docusign-key"
ssh_allowed_ips = ["YOUR_IP/32"]

# ========================================
# Database Passwords
# ========================================
nextjs_db_password      = "$(openssl rand -base64 16)"
keycloak_db_password    = "$(openssl rand -base64 16)"
docuseal_db_password    = "$(openssl rand -base64 16)"
keycloak_admin_password = "$(openssl rand -base64 16)"

# ========================================
# Application Secrets
# ========================================
nextauth_secret = "$(openssl rand -base64 32)"

# Keycloak client secret (for realm import)
keycloak_client_secret = "$(openssl rand -base64 32)"

# ========================================
# URLs and OAuth Config
# ========================================
nextauth_url = "http://PLACEHOLDER:3000"
keycloak_id  = "gis-docusign-client"

# Same as keycloak_client_secret initially
keycloak_secret = "$(openssl rand -base64 32)"  # Same value as above

keycloak_issuer  = "http://PLACEHOLDER:8080/realms/gis"
docuseal_api_key = "PLACEHOLDER_will_get_from_docuseal"
```

## Generate All Secrets Script

```bash
#!/bin/bash

echo "Generating all secrets..."

# Generate all secrets
NEXTJS_DB_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_DB_PASSWORD=$(openssl rand -base64 16)
DOCUSEAL_DB_PASSWORD=$(openssl rand -base64 16)
KEYCLOAK_ADMIN_PASSWORD=$(openssl rand -base64 16)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
KEYCLOAK_CLIENT_SECRET=$(openssl rand -base64 32)

# Get your IP
YOUR_IP=$(curl -s ifconfig.me)

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
# AWS Configuration
aws_region      = "us-east-1"
environment     = "production"
instance_type   = "t3.medium"
key_name        = "gis-docusign-key"
ssh_allowed_ips = ["$YOUR_IP/32"]

# Database Passwords
nextjs_db_password      = "$NEXTJS_DB_PASSWORD"
keycloak_db_password    = "$KEYCLOAK_DB_PASSWORD"
docuseal_db_password    = "$DOCUSEAL_DB_PASSWORD"
keycloak_admin_password = "$KEYCLOAK_ADMIN_PASSWORD"

# Application Secrets
nextauth_secret        = "$NEXTAUTH_SECRET"
keycloak_client_secret = "$KEYCLOAK_CLIENT_SECRET"

# URLs and OAuth Config
nextauth_url    = "http://PLACEHOLDER:3000"
keycloak_id     = "gis-docusign-client"
keycloak_secret = "$KEYCLOAK_CLIENT_SECRET"
keycloak_issuer = "http://PLACEHOLDER:8080/realms/gis"
docuseal_api_key = "PLACEHOLDER_will_get_from_docuseal"
EOF

echo "✓ terraform.tfvars created with generated secrets"
echo "✓ Remember to update placeholders after deployment!"
```

## Advanced: Regenerating the Secret

If you want to change the client secret after deployment:

### Option 1: Via Keycloak Admin Console

1. Access Keycloak admin console
2. Navigate to: Realms → gis → Clients → gis-docusign-client → Credentials
3. Click "Regenerate Secret"
4. Copy the new secret
5. Update `terraform.tfvars`:
   ```hcl
   keycloak_secret = "new-secret-from-keycloak"
   ```
6. Run `terraform apply`
7. Restart containers

### Option 2: Via Terraform (Re-import Realm)

1. Generate new secret: `openssl rand -base64 32`
2. Update `terraform.tfvars`:
   ```hcl
   keycloak_client_secret = "new-secret"
   keycloak_secret = "new-secret"
   ```
3. Delete and re-import realm:
   ```bash
   ssh ec2-user@$EC2_IP
   docker exec gis-keycloak /opt/keycloak/bin/kc.sh delete realm gis
   docker-compose restart keycloak-init
   ```
4. Run `terraform apply`

## Security Best Practices

✅ **Do's**:
- Generate strong secrets (min 32 characters)
- Use unique secrets for each deployment
- Store secrets securely (password manager)
- Never commit `terraform.tfvars` to git

❌ **Don'ts**:
- Don't use weak or predictable secrets
- Don't reuse secrets across environments
- Don't share secrets via insecure channels
- Don't hardcode secrets in code

## Troubleshooting

### "OAuth error: invalid_client"

**Cause**: Mismatch between `keycloak_secret` and actual client secret  
**Solution**: Ensure both variables have the same value initially

### "Validation failed: must be at least 32 characters"

**Cause**: Generated secret is too short  
**Solution**: Use `openssl rand -base64 32` (not -base64 16)

### "Client secret not found in Keycloak"

**Cause**: Realm import may have failed  
**Solution**: Check keycloak-init logs: `docker logs gis-keycloak-init`

## Summary

- **Generate**: `openssl rand -base64 32`
- **Set both**: `keycloak_client_secret` and `keycloak_secret` to same value
- **Deploy**: `terraform apply`
- **Verify**: Check Keycloak admin console
- **Secure**: Never commit secrets to git
