#!/bin/bash
# Script to delete users with @phone.studojo.local emails
# These are placeholder emails from phone-only signups that are no longer supported

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗑️  Deleting users with @phone.studojo.local emails...${NC}\n"

# Check if docker-compose is available and postgres container is running
if command -v docker-compose &> /dev/null && docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    echo "Using docker-compose to delete phone-only users..."
    
    # First, show how many users will be deleted
    COUNT=$(docker-compose exec -T postgres psql -U studojo -d postgres -t -c "SELECT COUNT(*) FROM \"user\" WHERE email LIKE '%@phone.studojo.local';" | tr -d ' ')
    
    if [ "$COUNT" -eq "0" ]; then
        echo -e "${GREEN}✓ No users with @phone.studojo.local emails found${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}Found $COUNT user(s) to delete:${NC}"
    docker-compose exec -T postgres psql -U studojo -d postgres -c "SELECT id, name, email, phone_number FROM \"user\" WHERE email LIKE '%@phone.studojo.local';"
    
    echo ""
    read -p "Are you sure you want to delete these users? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    
    # Delete users (cascade will handle related records)
    docker-compose exec -T postgres psql -U studojo -d postgres -c "DELETE FROM \"user\" WHERE email LIKE '%@phone.studojo.local';"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deleted $COUNT user(s) with @phone.studojo.local emails${NC}"
    else
        echo -e "${RED}✗ Failed to delete users${NC}"
        exit 1
    fi
    
elif command -v psql &> /dev/null; then
    # Try direct psql connection
    DATABASE_URL="${DATABASE_URL:-postgresql://studojo:studojo@localhost:5432/postgres}"
    echo "Using direct psql connection to delete phone-only users..."
    
    # First, show how many users will be deleted
    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"user\" WHERE email LIKE '%@phone.studojo.local';" | tr -d ' ')
    
    if [ "$COUNT" -eq "0" ]; then
        echo -e "${GREEN}✓ No users with @phone.studojo.local emails found${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}Found $COUNT user(s) to delete:${NC}"
    psql "$DATABASE_URL" -c "SELECT id, name, email, phone_number FROM \"user\" WHERE email LIKE '%@phone.studojo.local';"
    
    echo ""
    read -p "Are you sure you want to delete these users? (y/N) " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    
    # Delete users (cascade will handle related records)
    psql "$DATABASE_URL" -c "DELETE FROM \"user\" WHERE email LIKE '%@phone.studojo.local';"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Deleted $COUNT user(s) with @phone.studojo.local emails${NC}"
    else
        echo -e "${RED}✗ Failed to delete users${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Neither docker-compose nor psql found.${NC}"
    echo "Please either:"
    echo "  1. Start docker-compose: docker-compose up -d postgres"
    echo "  2. Install postgresql client: nix-shell -p postgresql"
    echo "  3. Or run manually: docker-compose exec postgres psql -U studojo -d postgres -c \"DELETE FROM \\\"user\\\" WHERE email LIKE '%@phone.studojo.local';\""
    exit 1
fi

echo -e "\n${GREEN}✅ Done!${NC}"

