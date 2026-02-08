#!/usr/bin/env bash
set -e

SERVICE_NAME="postgres"
DB_NAME="homeassistant"
DB_USER="tudruj"

if [ -z "$1" ]; then
  echo "❌ Podaj plik backupu:"
  echo "   ./scripts/restore-db.sh backups/2026-02-08_05-02-homeassistant.sql"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Plik nie istnieje: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  RESTORE DATABASE"
echo "📄 File: $BACKUP_FILE"
echo "🗄️  Database: $DB_NAME"
read -p "❗ To USUNIE aktualną bazę. Kontynuować? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "⛔ Anulowano"
  exit 0
fi

echo "🧹 Czyszczenie bazy..."

docker compose exec -T "$SERVICE_NAME" \
  psql -U "$DB_USER" -d "$DB_NAME" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "♻️  Przywracanie danych..."

docker compose exec -T "$SERVICE_NAME" \
  psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"

echo "✅ Restore zakończony"
