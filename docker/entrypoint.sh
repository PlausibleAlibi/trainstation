# docker/entrypoint.sh
#!/usr/bin/env sh
set -e

echo "Waiting for database to be ready..."
python - <<'PY'
import os, time
from sqlalchemy import create_engine
url = os.environ.get("DATABASE_URL")
assert url, "DATABASE_URL is not set"
for i in range(30):
    try:
        create_engine(url, pool_pre_ping=True).connect().close()
        print("DB is ready"); break
    except Exception as e:
        print(f"DB not ready yet ({e}); retrying...")
        time.sleep(2)
else:
    raise SystemExit("Database never became ready")
PY

echo "Running DB migrations..."
alembic upgrade head

echo "Starting app..."
exec uvicorn ${APP_MODULE:-main:app} --host 0.0.0.0 --port ${PORT:-8000} --workers ${UVICORN_WORKERS:-1}