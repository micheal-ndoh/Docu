# Terraform Backend Setup Guide

This guide explains how to set up remote state storage for Terraform using AWS S3 and DynamoDB.

## Why Remote Backend?

When running Terraform in CI/CD (GitHub Actions), you need a **remote backend** to:
- ✅ Store state persistently across workflow runs
- ✅ Enable team collaboration (shared state)
- ✅ Prevent concurrent modifications (state locking)
- ✅ Version state files for rollback capability
- ✅ Encrypt sensitive data at rest

## Architecture

```
GitHub Actions → S3 Bucket (terraform.tfstate)
              → DynamoDB (state locks)
```

**Resources Created:**
- **S3 Bucket**: `gis-docusign-mich-terraform-state`
  - Versioning: Enabled (90-day retention for old versions)
  - Encryption: AES256
  - Public Access: Blocked
  
- **DynamoDB Table**: `gis-docusign-mich-terraform-locks`
  - Billing: Pay-per-request
  - Purpose: Prevent concurrent Terraform operations

---

## 🚀 One-Time Setup (Run Locally)

### Prerequisites

- AWS CLI configured with credentials
- Terraform installed
- Proper AWS permissions to create S3 buckets and DynamoDB tables

### Step 1: Create Backend Infrastructure

Run the bootstrap Terraform configuration **once** from your local machine:

```bash
# Navigate to backend setup directory
cd terraform/backend-setup/

# Initialize Terraform (uses local state)
terraform init

# Review what will be created
terraform plan

# Create the S3 bucket and DynamoDB table
terraform apply

# Save the outputs for reference
terraform output
```

**Expected Output:**
```
s3_bucket_name        = "gis-docusign-mich-terraform-state"
dynamodb_table_name   = "gis-docusign-mich-terraform-locks"
backend_config        = (configuration to copy)
```

### Step 2: Initialize Main Terraform with Backend

After the backend infrastructure is created, initialize your main Terraform:

```bash
# Go back to main terraform directory
cd ..

# Initialize with the new backend
terraform init

# Terraform will ask if you want to migrate state
# Type 'yes' if you have existing local state to migrate
```

**Expected Prompt:**
```
Do you want to copy existing state to the new backend?
  Enter a value: yes
```

---

## 🔒 GitHub Actions Configuration

Your GitHub Actions workflow is **already configured** to use the remote backend automatically. No changes needed!

The workflow will:
1. Configure AWS credentials
2. Run `terraform init` (connects to S3 backend)
3. Run `terraform plan` (reads state from S3)
4. Run `terraform apply` (updates state in S3, acquires lock in DynamoDB)

---

## 🛡️ Security Considerations

### IAM Permissions Required

Your GitHub Actions AWS credentials need these permissions:

**S3 Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::gis-docusign-mich-terraform-state",
        "arn:aws:s3:::gis-docusign-mich-terraform-state/*"
      ]
    }
  ]
}
```

**DynamoDB Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": "arn:aws:dynamodb:eu-central-1:*:table/gis-docusign-mich-terraform-locks"
    }
  ]
}
```

---

## 📋 Verification

After setup, verify the backend is working:

### 1. Check S3 Bucket

```bash
# List state files in bucket
aws s3 ls s3://gis-docusign-mich-terraform-state/infra/

# Should show: terraform.tfstate
```

### 2. Check DynamoDB Table

```bash
# Describe the table
aws dynamodb describe-table \
  --table-name gis-docusign-mich-terraform-locks \
  --region eu-central-1
```

### 3. Test State Locking

```bash
# In one terminal:
cd terraform/
terraform plan  # This will acquire a lock

# In another terminal:
cd terraform/
terraform plan  # Should show "lock acquisition failed"
```

---

## 🔄 State Management

### View Current State

```bash
cd terraform/
terraform show
```

### List State Resources

```bash
terraform state list
```

### Download State for Inspection

```bash
# Pull state from S3 to local file
terraform state pull > current-state.json
```

### Rollback to Previous Version

If you need to rollback state (use with caution!):

```bash
# List versions in S3
aws s3api list-object-versions \
  --bucket gis-docusign-mich-terraform-state \
  --prefix infra/terraform.tfstate

# Download a specific version
aws s3api get-object \
  --bucket gis-docusign-mich-terraform-state \
  --key infra/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.backup
```

---

## 🚨 Troubleshooting

### Error: "Failed to acquire state lock"

**Cause:** Previous Terraform run didn't release the lock (crashed or interrupted)

**Solution:**
```bash
# Force unlock (use the Lock ID from error message)
terraform force-unlock <LOCK_ID>
```

### Error: "Backend configuration changed"

**Cause:** Backend configuration in `main.tf` doesn't match initialized backend

**Solution:**
```bash
# Reinitialize with -reconfigure flag
terraform init -reconfigure
```

### Error: "Access Denied" when accessing S3/DynamoDB

**Cause:** AWS credentials don't have required permissions

**Solution:**
- Verify IAM permissions (see Security Considerations above)
- Check AWS credentials are correctly configured:
  ```bash
  aws sts get-caller-identity
  ```

---

## 💰 Cost Estimation

**S3 Storage:**
- State file size: ~5-10 KB
- Cost: < $0.01/month

**S3 Requests:**
- ~10 requests per deployment
- Cost: < $0.01/month

**DynamoDB:**
- Pay-per-request pricing
- ~5-10 requests per deployment
- Cost: < $0.01/month

**Total Estimated Cost: < $0.05/month** (negligible)

---

## 🗑️ Cleanup (Destroying Everything)

If you want to completely tear down the infrastructure:

```bash
# 1. Destroy main infrastructure first
cd terraform/
terraform destroy

# 2. Then destroy backend infrastructure
cd backend-setup/
terraform destroy

# 3. Manually delete any remaining S3 object versions if needed
aws s3 rm s3://gis-docusign-mich-terraform-state --recursive
```

---

## 📚 References

- [Terraform S3 Backend Documentation](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
- [AWS S3 Versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [DynamoDB State Locking](https://developer.hashicorp.com/terraform/language/settings/backends/s3#dynamodb-state-locking)

---

## ✅ Quick Checklist

- [ ] Run `terraform/backend-setup/` to create S3 and DynamoDB
- [ ] Verify S3 bucket exists in AWS Console
- [ ] Verify DynamoDB table exists in AWS Console
- [ ] Run `terraform init` in main terraform directory
- [ ] Confirm state migration (if applicable)
- [ ] Verify GitHub Actions has proper IAM permissions
- [ ] Test deployment via GitHub Actions
- [ ] Confirm state file appears in S3 after deployment

