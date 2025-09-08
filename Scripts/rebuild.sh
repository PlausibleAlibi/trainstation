#!/usr/bin/env bash
set -euo pipefail

# Move into deploy/ so docker-compose.yml is in scope
cd "$(dirname "$0")/../deploy"

echo "🛑 Stopping containers..."
docker compose down -v

echo "🔨 Rebuilding images..."
docker compose build --no-cache

echo "🚀 Starting containers..."
docker compose up -d

echo
echo "✅ Rebuild complete."
echo "Check logs: docker compose logs -f"
echo "API:       http://localhost:8080"
echo "Frontend:  http://localhost:3000"
