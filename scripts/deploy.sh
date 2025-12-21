#!/bin/bash
set -e

echo "📥 Pulling changes..."
git pull

echo "🐳 Building & starting containers..."
docker compose up -d --build

echo "🗄️ Running database migrations..."
docker compose exec api npm run migrate:deploy

echo "✅ Deploy done"
