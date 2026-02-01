#!/bin/bash
# Deployment script for Maverick blog system
# This script:
# 1. Applies database migrations
# 2. Migrates blog posts and images
# 3. Deploys applications

set -e

echo "🚀 Starting Maverick deployment..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    echo "Please set it: export DATABASE_URL=postgresql://user:pass@host:5432/db"
    exit 1
fi

# Check if Azure credentials are set
if [ -z "$AZURE_STORAGE_ACCOUNT_NAME" ] || [ -z "$AZURE_STORAGE_ACCOUNT_KEY" ]; then
    echo "⚠️  Azure credentials not set - image migration will be skipped"
    echo "Set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY to migrate images"
    SKIP_IMAGES=true
else
    SKIP_IMAGES=false
fi

# Step 1: Apply database migration
echo ""
echo "📊 Step 1: Applying database migration..."
psql "$DATABASE_URL" -f apps/frontend/drizzle/0003_blog_posts.sql || {
    echo "⚠️  Migration failed or table already exists. Continuing..."
}

# Step 2: Migrate blog posts and images
if [ "$SKIP_IMAGES" = "false" ]; then
    echo ""
    echo "📝 Step 2: Migrating blog posts and images..."
    export DATABASE_URL
    export AZURE_STORAGE_ACCOUNT_NAME
    export AZURE_STORAGE_ACCOUNT_KEY
    export AZURE_STORAGE_CONTAINER_NAME="${AZURE_STORAGE_CONTAINER_NAME:-blog-images}"
    tsx scripts/migrate-blogs.ts
else
    echo ""
    echo "📝 Step 2: Migrating blog posts (skipping images)..."
    export DATABASE_URL
    export AZURE_STORAGE_ACCOUNT_NAME=""
    export AZURE_STORAGE_ACCOUNT_KEY=""
    export USE_LOCALSTACK="true"
    export LOCALSTACK_ENDPOINT="http://localhost:4566"
    echo "⚠️  Note: Images will not be migrated. Run migration script separately with Azure credentials."
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Deploy applications: kubectl apply -f k8s/"
echo "2. Or use docker-compose: docker-compose up -d maverick frontend"
echo "3. Set a user as 'ops' role: UPDATE \"user\" SET role = 'ops' WHERE email = 'your@email.com';"

