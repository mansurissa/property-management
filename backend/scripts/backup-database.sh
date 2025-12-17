#!/bin/bash

###############################################################################
# Database Backup Script for Renta Property Management System
#
# This script creates automated backups of the PostgreSQL database
#
# Usage:
#   ./scripts/backup-database.sh
#
# Requirements:
#   - PostgreSQL client tools (pg_dump)
#   - Read access to .env file
#   - Write access to backup directory
#
# Setup:
#   chmod +x scripts/backup-database.sh
#
# Cron Setup (daily at 2 AM):
#   0 2 * * * /path/to/project/backend/scripts/backup-database.sh
###############################################################################

# Load environment variables
set -a
source "$(dirname "$0")/../.env"
set +a

# Configuration
BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/renta_backup_${TIMESTAMP}.sql"
LOG_FILE="${BACKUP_DIR}/backup.log"
RETENTION_DAYS=30  # Keep backups for 30 days

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    log "ERROR: $1"
    exit 1
}

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    error_exit "pg_dump not found. Please install PostgreSQL client tools."
fi

# Validate environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    error_exit "Missing database configuration. Check .env file."
fi

log "Starting database backup..."
echo -e "${YELLOW}Backing up database: ${DB_NAME}${NC}"

# Set PostgreSQL password environment variable
export PGPASSWORD="$DB_PASSWORD"

# Perform backup with compression
pg_dump \
    -h "$DB_HOST" \
    -p "${DB_PORT:-5432}" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --format=custom \
    --compress=9 \
    --verbose \
    --file="$BACKUP_FILE" \
    2>&1 | tee -a "$LOG_FILE"

# Check if backup was successful
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    echo -e "${GREEN}✓ Backup completed successfully${NC}"
    log "Backup completed: $BACKUP_FILE (Size: $BACKUP_SIZE)"

    # Compress with gzip for additional space savings
    gzip "$BACKUP_FILE"
    COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    log "Backup compressed: ${BACKUP_FILE}.gz (Size: $COMPRESSED_SIZE)"

    # Clean up old backups
    echo -e "${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
    find "$BACKUP_DIR" -name "renta_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "renta_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS | wc -l)

    if [ "$DELETED_COUNT" -gt 0 ]; then
        log "Deleted $DELETED_COUNT old backup(s)"
    fi

    # List recent backups
    echo -e "${GREEN}Recent backups:${NC}"
    ls -lh "$BACKUP_DIR"/renta_backup_*.sql.gz | tail -5

    # Calculate total backup space used
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
    log "Total backup space used: $TOTAL_SIZE"

    exit 0
else
    error_exit "Backup failed. Check logs for details."
fi

# Unset password
unset PGPASSWORD
