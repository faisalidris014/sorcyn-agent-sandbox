#!/usr/bin/env bash
# ============================================================
# Reverse Marketplace — Database Backup Script
# ============================================================
# Usage:
#   ./scripts/backup.sh                    # Local backup only
#   R2_BUCKET_NAME=my-bucket ./scripts/backup.sh  # Backup + upload to R2
#
# Cron setup (daily at 3 AM):
#   0 3 * * * cd /opt/reverse-marketplace && docker compose -f docker-compose.production.yml exec -T postgres sh -c 'PGPASSWORD=$POSTGRES_PASSWORD pg_dump -U $POSTGRES_USER -Fc $POSTGRES_DB' > backups/rm_$(date +\%Y\%m\%d).dump 2>> /var/log/rm-backup.log
#
# Or run this script directly:
#   0 3 * * * /opt/reverse-marketplace/backend/scripts/backup.sh >> /var/log/rm-backup.log 2>&1
# ============================================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/opt/reverse-marketplace/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="rm_${TIMESTAMP}.dump"

# Database connection (from environment or defaults)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-reverse_marketplace}"

echo "[$(date -Iseconds)] Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run pg_dump with custom format (compressed, supports selective restore)
PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -Fc \
  --no-owner \
  --no-privileges \
  "$DB_NAME" > "$BACKUP_DIR/$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
echo "[$(date -Iseconds)] Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# Upload to Cloudflare R2 if configured
if [ -n "${R2_BUCKET_NAME:-}" ] && [ -n "${R2_ACCESS_KEY_ID:-}" ]; then
  echo "[$(date -Iseconds)] Uploading to R2 bucket: $R2_BUCKET_NAME..."
  aws s3 cp \
    "$BACKUP_DIR/$BACKUP_FILE" \
    "s3://$R2_BUCKET_NAME/backups/$BACKUP_FILE" \
    --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
    2>/dev/null
  echo "[$(date -Iseconds)] Upload complete."
fi

# Clean up old backups (keep last N days)
echo "[$(date -Iseconds)] Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "rm_*.dump" -type f -mtime +"$RETENTION_DAYS" -delete

REMAINING=$(find "$BACKUP_DIR" -name "rm_*.dump" -type f | wc -l | tr -d ' ')
echo "[$(date -Iseconds)] Backup complete. $REMAINING backups retained."
