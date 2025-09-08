#!/usr/bin/env sh
set -e
echo "Running DB migrations..."
alembic upgrade head
echo "Starting app..."
exec uvicorn ${APP_MODULE:-main:app} --host 0.0.0.0 --port ${PORT:-8000} --workers ${UVICORN_WORKERS:-1}