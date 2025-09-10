#!/usr/bin/env bash
set -euo pipefail

# repo root
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Accept optional tag/version argument, defaulting to latest tag or commit hash
VERSION_ARG="${1:-}"
if [[ -n "$VERSION_ARG" ]]; then
  VERSION="$VERSION_ARG"
else
  # Try to get latest tag, fallback to commit hash
  VERSION="$(git -C "$ROOT" describe --tags --abbrev=0 2>/dev/null || git -C "$ROOT" rev-parse --short HEAD || echo unknown)"
fi

# compute other values
GIT_COMMIT="$(git -C "$ROOT" rev-parse --short HEAD || echo unknown)"
GIT_BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD || echo unknown)"
BUILT_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# write a shared env file (used by API + web dev)
cat > "$ROOT/version.env" <<EOF
GIT_COMMIT=$GIT_COMMIT
GIT_BRANCH=$GIT_BRANCH
BUILT_AT=$BUILT_AT
VERSION=$VERSION
VITE_APP_VERSION=$VERSION
VITE_APP_DEPLOYED=$BUILT_AT
EOF

# Copy VITE_ variables to frontend/.env for Vite compatibility
if [[ -f "$ROOT/frontend/.env" ]]; then
  # Remove existing VITE_APP_ variables from frontend/.env and keep other lines
  grep -v '^VITE_APP_' "$ROOT/frontend/.env" > "$ROOT/frontend/.env.tmp" || touch "$ROOT/frontend/.env.tmp"
  # Append only the VITE_APP_ variables from version.env
  grep '^VITE_APP_' "$ROOT/version.env" >> "$ROOT/frontend/.env.tmp"
  mv "$ROOT/frontend/.env.tmp" "$ROOT/frontend/.env"
else
  # Create new .env file with only VITE_APP_ variables from version.env
  grep '^VITE_APP_' "$ROOT/version.env" > "$ROOT/frontend/.env"
fi

echo "Wrote $ROOT/version.env:"
cat "$ROOT/version.env"
echo
echo "Updated $ROOT/frontend/.env with VITE_APP_ variables:"
grep '^VITE_APP_' "$ROOT/frontend/.env" || echo "No VITE_APP_ variables found"