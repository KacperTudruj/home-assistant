#!/usr/bin/env bash
set -e

LOCAL_DIR="$(dirname "$0")/backups"
REMOTE_DIR="$HOME/db-backups"

echo "🔁 Sync backups..."
rsync -av --delete "$LOCAL_DIR/" "$REMOTE_DIR/"
echo "✅ Sync done"
