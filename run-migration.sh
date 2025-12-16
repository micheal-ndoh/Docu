#!/bin/bash

# User Filtering Migration Script
# This script runs the Prisma migration to add Template and Submission models

echo "🔄 Running Prisma migration for user filtering..."
echo ""

# Check if Docker is running
if docker ps &> /dev/null; then
    echo "✅ Docker is running"
    echo "📦 Running migration inside Docker container..."
    docker-compose exec nextjs-app npx prisma migrate dev --name add_user_template_submission_tracking
else
    echo "⚠️  Docker is not running or not accessible"
    echo "📦 Running migration locally..."
    npx prisma migrate dev --name add_user_template_submission_tracking
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Restart your application if needed"
echo "2. Test with multiple user accounts"
echo "3. Check USER_FILTERING_IMPLEMENTATION.md for details"
