#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root (so paths are stable)
cd "$(dirname "$0")/.."

# Where the compose file lives
COMPOSE="deploy/docker-compose.yml"

# Alembic config path *inside the container*
ALEMBIC_CFG="/app/alembic.ini"

run_in_container() {
  # Use a one-off container so it works even if api isn’t running
  docker compose -f "$COMPOSE" run --rm --entrypoint sh api -lc "$1"
}

case "${1:-}" in
  make|revision)
    # Create a new migration (autogenerate)
    # Usage: ./scripts/migrate.sh make "add foo table"
    MSG="${2:-migration}"
    run_in_container "python -m alembic -c $ALEMBIC_CFG revision --autogenerate -m \"$MSG\""
    ;;

  up|upgrade)
    # Upgrade to latest (head) or specific revision
    # Usage: ./scripts/migrate.sh up
    #        ./scripts/migrate.sh up <revision_id>
    REV="${2:-head}"
    run_in_container "python -m alembic -c $ALEMBIC_CFG upgrade \"$REV\""
    ;;

  down|downgrade)
    # Downgrade one step or to a specific revision
    # Usage: ./scripts/migrate.sh down -1
    #        ./scripts/migrate.sh down <revision_id>
    REV="${2:--1}"
    run_in_container "python -m alembic -c $ALEMBIC_CFG downgrade \"$REV\""
    ;;

  current)
    run_in_container "python -m alembic -c $ALEMBIC_CFG current"
    ;;

  heads)
    run_in_container "python -m alembic -c $ALEMBIC_CFG heads"
    ;;

  history)
    run_in_container "python -m alembic -c $ALEMBIC_CFG history"
    ;;

  stamp)
    # Mark the DB at a given revision without running migrations
    # Usage: ./scripts/migrate.sh stamp head
    REV="${2:-head}"
    run_in_container "python -m alembic -c $ALEMBIC_CFG stamp \"$REV\""
    ;;

  status)
    # Quick health check: show DB URL and tables
    run_in_container '
      echo "DB URL: $DATABASE_URL"
      python - <<PY
from models import Base
print("Models:", [t.name for t in Base.metadata.sorted_tables])
PY
      python - <<PY
from sqlalchemy import create_engine, inspect
import os
insp = inspect(create_engine(os.environ["DATABASE_URL"]))
print("DB tables:", insp.get_table_names())
PY
    '
    ;;

  *)
    cat <<USAGE
Usage: $0 <command> [args]

Commands:
  make "message"      Create an autogenerate migration
  up [rev]            Upgrade to head (default) or a specific revision
  down [rev]          Downgrade one step (-1 default) or to a specific revision
  current             Show current revision
  heads               Show head revisions
  history             Show migration history
  stamp [rev]         Set revision without running migrations
  status              Print models & DB table list

Examples:
  $0 make "init schema"
  $0 up
  $0 down -1
  $0 current
USAGE
    exit 1
    ;;
esac
