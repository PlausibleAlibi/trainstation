#!/usr/bin/env bash
set -euo pipefail

# Move into deploy/ so docker-compose.yml is in scope
cd "$(dirname "$0")/../deploy"

echo "🔄 Restarting containers (no rebuild, DB preserved)..."
docker compose down
docker compose up -d

echo
echo "✅ Restart complete."
echo "Check logs: docker compose logs -f"
echo "API:       http://localhost:8080"
echo "Frontend:  http://localhost:3000"