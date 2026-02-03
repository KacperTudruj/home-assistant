#!/bin/bash
set -e

echo "📥 Pulling changes..."
git pull

echo "🐳 Building & starting containers..."
docker compose build api
docker compose run --rm api npx prisma migrate deploy
docker compose up -d

echo "✅ Deploy done"
