#!/usr/bin/env bash
set -euo pipefail

# Uses root-level docker-compose.yml for log access
# This script tails logs from running containers
cd "$(dirname "$0")/.."

# Default: tail all services
if [[ $# -eq 0 ]]; then
  echo "📜 Tailing logs for all services..."
  docker compose logs -f
else
  # Tail only specified services (e.g., ./Scripts/taillogs.sh api db)
  echo "📜 Tailing logs for: $*"
  docker compose logs -f "$@"
fi