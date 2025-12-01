# One-Time Setup: Create S3 Backend Infrastructure

This script creates the S3 bucket and DynamoDB table needed for Terraform state management.
**Run this ONCE before your first `terraform init`.**

## Prerequisites
- AWS CLI configured with credentials
- Permissions to create S3 buckets and DynamoDB tables

## Run Setup

```bash
# Set variables
export AWS_REGION="us-east-1"
export STATE_BUCKET="gis-docusign-terraform-state"
export LOCK_TABLE="gis-docusign-terraform-locks"

# Create S3 bucket for state
aws s3api create-bucket \
  --bucket $STATE_BUCKET \
  --region $AWS_REGION

# Enable versioning (keeps history of state changes)
aws s3api put-bucket-versioning \
  --bucket $STATE_BUCKET \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket $STATE_BUCKET \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access (security best practice)
aws s3api put-public-access-block \
  --bucket $STATE_BUCKET \
  --public-access-block-configuration \
    BlockPublicAcls=true,\
IgnorePublicAcls=true,\
BlockPublicPolicy=true,\
RestrictPublicBuckets=true

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name $LOCK_TABLE \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $AWS_REGION

echo "✅ S3 backend infrastructure created successfully!"
```

## Verify Setup

```bash
# Check S3 bucket
aws s3 ls s3://$STATE_BUCKET

# Check DynamoDB table
aws dynamodb describe-table --table-name $LOCK_TABLE --query 'Table.TableStatus'
```

## Cost Estimate
- **S3**: ~$0.023/GB/month + minimal request costs
- **DynamoDB**: Pay-per-request (very low for Terraform state)
- **Total**: < $1/month for typical usage

## Security Notes
- State file contains sensitive data (encrypted at rest with SSE-S3)
- Access controlled via IAM policies
- Versioning enabled for disaster recovery
- Public access blocked by default
