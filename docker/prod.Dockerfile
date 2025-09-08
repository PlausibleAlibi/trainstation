# syntax=docker/dockerfile:1.7

##
## TrainStation Production Dockerfile (multi-arch friendly)
## - Python slim base
## - System deps for Postgres/compilation
## - Cached pip install from requirements.txt
## - Non-root runtime user
## - Healthcheck-ready (curl installed)
## - Flexible entrypoint via env (APP_MODULE, PORT, UVICORN_* options)
##

ARG PYTHON_VERSION=3.11
FROM --platform=$BUILDPLATFORM python:${PYTHON_VERSION}-slim AS runtime

# ---- Runtime settings
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Defaults you can override at runtime:
    APP_MODULE="src.main:app" \
    PORT=8000 \
    UVICORN_HOST="0.0.0.0" \
    UVICORN_LOG_LEVEL="info" \
    UVICORN_WORKERS="1" \
    UVICORN_RELOAD="false"

WORKDIR /app

# ---- System dependencies (keep minimal)
# libpq-dev: for psycopg2-binary (and future building if needed)
# curl: for optional healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      curl \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Python dependencies (cache-friendly)
# Place requirements.txt at repo root (recommended).
# If you keep it elsewhere, adjust the COPY path accordingly.
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# ---- Copy application code
# Expect your code under app/ with entry at src.main:app (adjust if different)
COPY app /app

# ---- Create and use non-root user
RUN useradd -m appuser
USER appuser

# ---- Expose service port
EXPOSE 8000

# ---- Optional healthcheck (enable if you have /health)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:${PORT}/health || exit 1

# ---- Start command (Uvicorn)
# You can override ENV for workers, log level, etc., at runtime or in compose.
# Example overrides in compose:
#   environment:
#     - UVICORN_WORKERS=2
#     - PORT=8000
CMD ["sh", "-lc", "exec uvicorn ${APP_MODULE} --host ${UVICORN_HOST} --port ${PORT} --log-level ${UVICORN_LOG_LEVEL} --proxy-headers --forwarded-allow-ips='*' --workers ${UVICORN_WORKERS} ${UVICORN_RELOAD:+--reload}"]