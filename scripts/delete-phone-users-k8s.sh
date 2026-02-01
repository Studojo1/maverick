#!/bin/bash
# Script to delete users with @phone.studojo.local emails from Kubernetes deployment
# These are placeholder emails from phone-only signups that are no longer supported

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🗑️  Deleting users with @phone.studojo.local emails from Kubernetes...${NC}\n"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}✗ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace studojo &> /dev/null; then
    echo -e "${RED}✗ Namespace 'studojo' not found${NC}"
    exit 1
fi

# Get postgres pod name
POSTGRES_POD=$(kubectl get pods -n studojo -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POSTGRES_POD" ]; then
    echo -e "${RED}✗ PostgreSQL pod not found in studojo namespace${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found PostgreSQL pod: $POSTGRES_POD${NC}\n"

# First, show how many users will be deleted
COUNT=$(kubectl exec -n studojo "$POSTGRES_POD" -- psql -U studojo -d postgres -t -c "SELECT COUNT(*) FROM \"user\" WHERE email LIKE '%@phone.studojo.local';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$COUNT" -eq "0" ] || [ -z "$COUNT" ]; then
    echo -e "${GREEN}✓ No users with @phone.studojo.local emails found${NC}"
    exit 0
fi

echo -e "${YELLOW}Found $COUNT user(s) to delete:${NC}"
kubectl exec -n studojo "$POSTGRES_POD" -- psql -U studojo -d postgres -c "SELECT id, name, email, phone_number FROM \"user\" WHERE email LIKE '%@phone.studojo.local';"

echo ""
read -p "Are you sure you want to delete these users? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

# Delete users (cascade will handle related records)
kubectl exec -n studojo "$POSTGRES_POD" -- psql -U studojo -d postgres -c "DELETE FROM \"user\" WHERE email LIKE '%@phone.studojo.local';"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deleted $COUNT user(s) with @phone.studojo.local emails${NC}"
else
    echo -e "${RED}✗ Failed to delete users${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Done!${NC}"

