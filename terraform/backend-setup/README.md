# Terraform Backend Setup

This directory contains the bootstrap configuration to create the S3 bucket and DynamoDB table required for storing Terraform state remotely.

## DO NOT DELETE

This directory should be kept separate from the main Terraform configuration because:
- It creates the backend infrastructure
- It uses local state (chicken-and-egg problem)
- It only needs to be run once

## Resources Created

- **S3 Bucket**: `gis-docusign-mich-terraform-state`
  - Versioning enabled
  - Server-side encryption (AES256)
  - Public access blocked
  - Lifecycle policy (90 days for old versions)

- **DynamoDB Table**: `gis-docusign-mich-terraform-locks`
  - Pay-per-request billing
  - Used for state locking

## Setup Instructions

See the main `BACKEND_SETUP.md` in the project root for complete setup instructions.
