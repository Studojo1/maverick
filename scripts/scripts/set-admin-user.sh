#!/bin/bash
# Script to set a user as admin in the database
# Usage: ./scripts/set-admin-user.sh <user-email>
# Works with docker-compose or direct postgres connection

if [ -z "$1" ]; then
    echo "Usage: $0 <user-email>"
    echo "Example: $0 admin@studojo.com"
    exit 1
fi

USER_EMAIL="$1"

# Check if docker-compose is available and postgres container is running
if command -v docker-compose &> /dev/null && docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
    echo "Using docker-compose to set user '$USER_EMAIL' as admin..."
    docker-compose exec -T postgres psql -U studojo -d postgres -c "UPDATE \"user\" SET role = 'admin' WHERE email = '$USER_EMAIL';"
    
    echo ""
    echo "To set a user as 'ops' role instead, run:"
    echo "docker-compose exec -T postgres psql -U studojo -d postgres -c \"UPDATE \\\"user\\\" SET role = 'ops' WHERE email = '$USER_EMAIL';\""
    
    if [ $? -eq 0 ]; then
        echo "✓ User '$USER_EMAIL' has been set as admin"
        echo ""
        echo "Verifying admin users:"
        docker-compose exec -T postgres psql -U studojo -d postgres -c "SELECT id, name, email, role FROM \"user\" WHERE role = 'admin';"
    else
        echo "✗ Failed to set user as admin. Make sure the email exists in the database."
        exit 1
    fi
elif command -v psql &> /dev/null; then
    # Try direct psql connection
    DATABASE_URL="${DATABASE_URL:-postgresql://studojo:studojo@localhost:5432/postgres}"
    echo "Using direct psql connection to set user '$USER_EMAIL' as admin..."
    psql "$DATABASE_URL" -c "UPDATE \"user\" SET role = 'admin' WHERE email = '$USER_EMAIL';"
    
    if [ $? -eq 0 ]; then
        echo "✓ User '$USER_EMAIL' has been set as admin"
        echo ""
        echo "Verifying admin users:"
        psql "$DATABASE_URL" -c "SELECT id, name, email, role FROM \"user\" WHERE role = 'admin';"
    else
        echo "✗ Failed to set user as admin. Make sure the email exists in the database."
        exit 1
    fi
else
    echo "✗ Neither docker-compose nor psql found."
    echo "Please either:"
    echo "  1. Start docker-compose: docker-compose up -d postgres"
    echo "  2. Install postgresql client: nix-shell -p postgresql"
    echo "  3. Or run manually: docker-compose exec postgres psql -U studojo -d postgres -c \"UPDATE \\\"user\\\" SET role = 'admin' WHERE email = '$USER_EMAIL';\""
    exit 1
fi

