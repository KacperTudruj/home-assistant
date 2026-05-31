#!/bin/bash
set -e

ENV_ARGS="--env-file .env"
if [ -f .env.local ]; then
    ENV_ARGS="$ENV_ARGS --env-file .env.local"
fi

echo "📥 Pulling changes..."
git pull

echo "🐳 Building containers (updating packages)..."
docker compose $ENV_ARGS build --no-cache api

echo "🧬 Applying migrations..."
docker compose $ENV_ARGS run --rm api npm run migrate:deploy

echo "🚀 Starting containers..."
docker compose $ENV_ARGS up -d --force-recreate --build

echo "✅ Deploy done"
