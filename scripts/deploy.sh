#!/bin/bash
set -e

echo "📥 Pulling changes..."
git pull

echo "🐳 Building containers (updating packages)..."
docker compose build --no-cache api

echo "🧬 Applying migrations..."
docker compose run --rm api npm run migrate:deploy

echo "🚀 Starting containers..."
docker compose up -d --force-recreate --build

echo "✅ Deploy done"
