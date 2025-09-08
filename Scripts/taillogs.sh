#!/usr/bin/env bash
set -euo pipefail

# Move into deploy/ so docker-compose.yml is in scope
cd "$(dirname "$0")/../deploy"

# Default: tail all services
if [[ $# -eq 0 ]]; then
  echo "📜 Tailing logs for all services..."
  docker compose logs -f
else
  # Tail only specified services (e.g., ./scripts/logs.sh web db)
  echo "📜 Tailing logs for: $*"
  docker compose logs -f "$@"
fi