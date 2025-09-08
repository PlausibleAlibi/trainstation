#!/usr/bin/env bash
set -euo pipefail

# TrainStation tag/release helper
# Usage:
#   scripts/tag.sh v1.2.3 [--notes "Release notes..."] [--no-release]
#
# Behavior:
#   - Validates semver tag starting with "v"
#   - Ensures clean working tree and on 'main'
#   - Pushes current main branch
#   - Creates annotated git tag and pushes it
#   - Notes precedence:
#       1) --notes "..." (highest)
#       2) docs/releases/<TAG>.md (if exists)
#       3) CHANGELOG latest section (best-effort)
#       4) Fallback: "TrainStation <TAG> release"
#   - If gh CLI is installed (and not --no-release), creates a GitHub Release
#
# Requirements:
#   - git
#   - (optional) gh CLI authenticated to your repo remote

NOTES=""
CREATE_RELEASE=1

die() { echo "ERROR: $*" >&2; exit 1; }

if [[ $# -lt 1 ]]; then
  die "Usage: $0 vMAJOR.MINOR.PATCH [--notes \"...\"] [--no-release]"
fi

TAG="$1"; shift

# Parse optional flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --notes)
      shift
      NOTES="${1:-}"; shift || true
      ;;
    --no-release)
      CREATE_RELEASE=0
      shift
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

# Validate tag format vX.Y.Z
if [[ ! "$TAG" =~ ^v([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
  die "Tag must be semver like v1.2.3 (got: $TAG)"
fi

# Ensure on main
CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$CURRENT_BRANCH" == "main" ]] || die "Please switch to 'main' (current: $CURRENT_BRANCH)"

# Ensure clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  die "Working tree not clean. Commit or stash changes first."
fi

# Fetch and ensure tag doesn't already exist
git fetch --tags
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  die "Tag $TAG already exists."
fi

# Push latest main so the tag points to a remote-visible commit
git push origin main

# --- Resolve release notes (precedence described above) ---
if [[ -z "$NOTES" ]]; then
  NOTES_FILE="docs/releases/${TAG}.md"
  if [[ -f "$NOTES_FILE" ]]; then
    NOTES="$(cat "$NOTES_FILE")"
  fi
fi

if [[ -z "$NOTES" && -f CHANGELOG.md ]]; then
  # Best-effort: extract latest section from CHANGELOG.md (first section after top header)
  NOTES="$(awk '/^## /{c++} c==1{print}' CHANGELOG.md | sed '1d' || true)"
fi

NOTES="${NOTES:-TrainStation ${TAG} release}"

# Create annotated tag and push
git tag -a "$TAG" -m "Release $TAG"
git push origin "$TAG"

# Derive owner/repo and lowercase owner for GHCR path
ORIGIN_URL="$(git config --get remote.origin.url)"
# Support both HTTPS and SSH remote formats
if [[ "$ORIGIN_URL" =~ github.com[:/](.+)\.git$ ]]; then
  OWNER_REPO="${BASH_REMATCH[1]}"
else
  die "Unable to parse remote origin URL for owner/repo."
fi
OWNER="${OWNER_REPO%%/*}"
REPO="${OWNER_REPO##*/}"
LOWER_OWNER="$(echo "$OWNER" | tr '[:upper:]' '[:lower:]')"

echo
echo "✅ Tagged $TAG and pushed to GitHub."
echo "   Repo: https://github.com/${OWNER}/${REPO}"
echo "   CI will build & publish multi-arch images to:"
echo "     ghcr.io/${LOWER_OWNER}/${REPO}:${TAG}"
echo "     ghcr.io/${LOWER_OWNER}/${REPO}:$(echo ${TAG#v})"
echo "     ghcr.io/${LOWER_OWNER}/${REPO}:$(echo ${TAG#v} | cut -d. -f1-2)"
echo "     ghcr.io/${LOWER_OWNER}/${REPO}:$(echo ${TAG#v} | cut -d. -f1)"
echo

# Optional GitHub Release
if [[ "$CREATE_RELEASE" -eq 1 ]]; then
  if command -v gh >/dev/null 2>&1; then
    echo "📦 Creating GitHub Release ${TAG}..."
    # If NOTES contains backticks or special chars, pass via stdin
    printf "%s" "$NOTES" | gh release create "$TAG" -F - -t "$TAG"
    echo "   Release: https://github.com/${OWNER}/${REPO}/releases/tag/${TAG}"
  else
    echo "ℹ️  'gh' CLI not found; skipping GitHub Release creation."
    echo "    Install: https://cli.github.com/"
  fi
fi

echo "🎉 Done. When Actions is green, deploy with:"
echo "   cd deploy && docker compose pull && docker compose up -d && curl http://localhost:8080/health"