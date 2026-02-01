#!/bin/bash
# Run blog migration locally with production credentials
# This script migrates blog posts and images from data/ to production database and blob storage

set -e

echo "📝 Starting blog migration..."

# Check required environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set"
    echo "Please set it: export DATABASE_URL=postgresql://user:pass@host:5432/db"
    exit 1
fi

if [ -z "$AZURE_STORAGE_ACCOUNT_NAME" ] || [ -z "$AZURE_STORAGE_ACCOUNT_KEY" ]; then
    echo "❌ Azure storage credentials not set"
    echo "Please set:"
    echo "  export AZURE_STORAGE_ACCOUNT_NAME=your-account-name"
    echo "  export AZURE_STORAGE_ACCOUNT_KEY=your-account-key"
    exit 1
fi

# Set default container name if not provided
export AZURE_STORAGE_CONTAINER_NAME="${AZURE_STORAGE_CONTAINER_NAME:-blog-images}"

# Check if data files exist
if [ ! -f "data/studojo.blog_posts.json" ]; then
    echo "❌ Blog posts JSON file not found: data/studojo.blog_posts.json"
    exit 1
fi

if [ ! -d "data/blog-images" ]; then
    echo "⚠️  Images directory not found: data/blog-images"
    echo "Continuing without image migration..."
fi

# Run migration
echo "🚀 Running migration script..."
tsx scripts/migrate-blogs.ts

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Verify posts in database"
echo "2. Check images in blob storage"
echo "3. Access Maverick at: https://maverick.studojo.pro"

