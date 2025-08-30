#!/usr/bin/env bash
set -euo pipefail

# repo root
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# compute values
GIT_COMMIT="$(git -C "$ROOT" rev-parse --short HEAD || echo unknown)"
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# write a shared env file (used by API + web dev)
cat > "$ROOT/version.env" <<EOF
GIT_COMMIT=$GIT_COMMIT
BUILT_AT=$BUILT_AT
VITE_APP_VERSION=$GIT_COMMIT
VITE_APP_DEPLOYED=$BUILT_AT
EOF

echo "Wrote $ROOT/version.env:"
cat "$ROOT/version.env"