#!/bin/bash

###############################################################################
# Database Restore Script for Renta Property Management System
#
# This script restores a PostgreSQL database from backup
#
# Usage:
#   ./scripts/restore-database.sh [backup_file]
#
# Example:
#   ./scripts/restore-database.sh backups/renta_backup_20251217_020000.sql.gz
#
# WARNING: This will DROP and recreate the database!
###############################################################################

# Load environment variables
set -a
source "$(dirname "$0")/../.env"
set +a

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}ERROR: No backup file specified${NC}"
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh "$(dirname "$0")/../backups"/renta_backup_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Validate backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}ERROR: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if pg_restore is available
if ! command -v pg_restore &> /dev/null; then
    echo -e "${RED}ERROR: pg_restore not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Confirmation prompt
echo -e "${YELLOW}==================== WARNING ====================${NC}"
echo -e "${RED}This will DROP the database: ${DB_NAME}${NC}"
echo -e "${RED}All current data will be LOST!${NC}"
echo -e "${YELLOW}=================================================${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to proceed): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Set PostgreSQL password
export PGPASSWORD="$DB_PASSWORD"

echo -e "${YELLOW}Decompressing backup file...${NC}"
TEMP_FILE="/tmp/renta_restore_$$.sql"

if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
else
    cp "$BACKUP_FILE" "$TEMP_FILE"
fi

echo -e "${YELLOW}Dropping existing database...${NC}"
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>&1

echo -e "${YELLOW}Creating fresh database...${NC}"
psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" 2>&1

echo -e "${YELLOW}Restoring database from backup...${NC}"
pg_restore \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-acl \
    "$TEMP_FILE" 2>&1

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"

    # Clean up temp file
    rm -f "$TEMP_FILE"

    echo ""
    echo -e "${GREEN}Database: ${DB_NAME}${NC}"
    echo -e "${GREEN}Restored from: ${BACKUP_FILE}${NC}"
    echo -e "${GREEN}Date: $(date)${NC}"

    exit 0
else
    echo -e "${RED}✗ Restore failed${NC}"
    rm -f "$TEMP_FILE"
    exit 1
fi

# Unset password
unset PGPASSWORD
