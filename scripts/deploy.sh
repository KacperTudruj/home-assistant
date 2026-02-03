#!/bin/bash
set -e

echo "📥 Pulling changes..."
git pull

echo "🐳 Building containers..."
docker compose build api

echo "🧬 Applying migrations..."
docker compose run --rm api npm run migrate:deploy

echo "🚀 Starting containers..."
docker compose up -d --force-recreate

echo "✅ Deploy done"
