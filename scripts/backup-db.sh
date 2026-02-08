#!/usr/bin/env bash
set -e

SERVICE_NAME="postgres"
DB_NAME="homeassistant"
DB_USER="tudruj"

BACKUP_DIR="$(dirname "$0")/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
FILE="$BACKUP_DIR/${TIMESTAMP}-${DB_NAME}.sql"

mkdir -p "$BACKUP_DIR"

echo "📦 database backup: $DB_NAME"
echo "➡️  File: $FILE"

docker compose exec -T "$SERVICE_NAME" \
  pg_dump -U "$DB_USER" "$DB_NAME" > "$FILE"

echo "✅ Backup finished"
