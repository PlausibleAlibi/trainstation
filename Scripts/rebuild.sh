#!/usr/bin/env bash
set -euo pipefail

# Uses root-level docker-compose.yml with production defaults
# This script rebuilds and restarts all containers
cd "$(dirname "$0")/.."

CLEAN=0
if [[ "${1:-}" == "--clean" ]]; then
  CLEAN=1
fi

if [[ "$CLEAN" -eq 1 ]]; then
  echo "🛑 Stopping containers and removing volumes (DB will be wiped)..."
  docker compose down -v
else
  echo "🛑 Stopping containers (DB will be preserved)..."
  docker compose down
fi

echo "🔨 Rebuilding images..."
docker compose build --no-cache

echo "🚀 Starting containers..."
docker compose up -d

echo
echo "✅ Rebuild complete."
echo "Check logs: docker compose logs -f"
echo "API:       http://localhost"
echo "Frontend:  http://localhost"

if [[ "$CLEAN" -eq 1 ]]; then
  echo "⚠️  Database volume was reset (dbdata wiped)."
fi