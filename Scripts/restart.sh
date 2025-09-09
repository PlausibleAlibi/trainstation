#!/usr/bin/env bash
set -euo pipefail

# Uses root-level docker-compose.yml with production defaults
# This script restarts containers without rebuilding images
cd "$(dirname "$0")/.."

echo "🔄 Restarting containers (no rebuild, DB preserved)..."
docker compose down
docker compose up -d

echo
echo "✅ Restart complete."
echo "Check logs: docker compose logs -f"
echo "API:       http://localhost"
echo "Frontend:  http://localhost"