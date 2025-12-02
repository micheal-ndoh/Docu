# Local Testing Guide

This guide explains how to test the deployment locally before using the CI/CD pipeline.

## Current Configuration

✅ **Backend:** Local (state stored in `terraform.tfstate`)  
✅ **Variables:** Loaded from `terraform.tfvars`  

## Prerequisites

1. **AWS Credentials Configured:**
   ```bash
   aws configure
   # Enter your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
   ```

2. **OpenNext Build:**
   ```bash
   npm install
   npm run build:open-next
   ```
   This creates the `.open-next/` directory that Terraform needs.

## Test Deployment Locally

```bash
cd terraform

# 1. Initialize Terraform (first time only)
terraform init

# 2. See what will be created
terraform plan

# 3. Deploy to AWS
terraform apply
# Type 'yes' when prompted

# 4. Get the CloudFront URL
terraform output cloudfront_url
```

## Verify Deployment

Once deployed, you'll get a CloudFront URL like:
```
https://d111111abcdef8.cloudfront.net
```

Open it in your browser and test:
- ✅ Authentication (Keycloak login)
- ✅ Database connection (create a submission)
- ✅ DocuSeal integration (document signing)

## Destroy Resources (When Done Testing)

```bash
cd terraform
terraform destroy
# Type 'yes' when prompted
```

## Switch to CI/CD (After Testing)

Once you've verified everything works locally:

1. **Update `main.tf` backend:**
   ```hcl
   backend "s3" {
     bucket         = "gis-docusign-terraform-state"
     key            = "production/terraform.tfstate"
     region         = "us-east-1"
     encrypt        = true
     dynamodb_table = "gis-docusign-terraform-locks"
   }
   ```

2. **Create backend resources:**
   ```bash
   ./setup-backend.sh
   ```

3. **Migrate state to S3:**
   ```bash
   terraform init -migrate-state
   # Type 'yes' when prompted
   ```

4. **Delete local tfvars and commit:**
   ```bash
   rm terraform.tfvars  # Don't commit secrets!
   git add .
   git commit -m "feat: switch to S3 backend for CI/CD"
   git push
   ```

5. **Set GitHub Secrets** (Settings → Secrets → Actions):
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`
   - `NEXTAUTH_URL` (use CloudFront URL)
   - `NEXTAUTH_SECRET`
   - `KEYCLOAK_ID`
   - `KEYCLOAK_SECRET`
   - `KEYCLOAK_ISSUER`
   - `DOCUSEAL_API_KEY`
   - `DOCUSEAL_URL`

Now GitHub Actions will handle deployments automatically!

---

## Troubleshooting

### "Error: No valid credential sources found"
Run: `aws configure` and enter your AWS credentials.

### "Error: fileset() failed"
Run: `npm run build:open-next` first (Terraform needs `.open-next/` directory).

### Lambda cold start is slow
This is normal. First request takes 3-5 seconds, then it's fast.

### Static files not loading
Check CloudFront distribution status in AWS Console. It takes 5-10 minutes to deploy globally.
