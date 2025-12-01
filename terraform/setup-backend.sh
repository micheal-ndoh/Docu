#!/bin/bash
set -e

# Configuration
export AWS_REGION="us-east-1"
export STATE_BUCKET="gis-docusign-terraform-state"
export LOCK_TABLE="gis-docusign-terraform-locks"

echo "🚀 Starting backend setup..."
echo "Region: $AWS_REGION"
echo "Bucket: $STATE_BUCKET"
echo "Table:  $LOCK_TABLE"

# 1. Create S3 bucket
echo "📦 Creating S3 bucket..."
if aws s3api head-bucket --bucket "$STATE_BUCKET" 2>/dev/null; then
    echo "   Bucket already exists."
else
    aws s3api create-bucket --bucket "$STATE_BUCKET" --region "$AWS_REGION"
    echo "   Bucket created."
fi

# 2. Enable versioning
echo "📜 Enabling versioning..."
aws s3api put-bucket-versioning --bucket "$STATE_BUCKET" --versioning-configuration Status=Enabled

# 3. Enable encryption
echo "🔒 Enabling encryption..."
aws s3api put-bucket-encryption --bucket "$STATE_BUCKET" --server-side-encryption-configuration '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'

# 4. Create DynamoDB table
echo "🗄️  Creating DynamoDB table..."
if aws dynamodb describe-table --table-name "$LOCK_TABLE" --region "$AWS_REGION" >/dev/null 2>&1; then
    echo "   Table already exists."
else
    aws dynamodb create-table \
        --table-name "$LOCK_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"
    echo "   Table created."
fi

echo "✅ Backend setup complete!"
echo "   You can now run 'terraform init'"
