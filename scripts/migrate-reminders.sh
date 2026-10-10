#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
# Uses the existing api container and its DATABASE_URL. Applies ALL pending Prisma migrations.
docker compose exec -T api npm run migrate:deploy
docker compose exec -T api npm run prisma:generate
