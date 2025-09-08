# syntax=docker/dockerfile:1.7
ARG PYTHON_VERSION=3.12
FROM --platform=$BUILDPLATFORM python:${PYTHON_VERSION}-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_MODULE="main:app" \
    PORT=8000 \
    UVICORN_HOST="0.0.0.0" \
    UVICORN_LOG_LEVEL="info" \
    UVICORN_WORKERS="1" \
    UVICORN_RELOAD="false"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libpq-dev \
      curl \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

COPY app /app

RUN useradd -m appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD curl -fsS http://localhost:${PORT}/health || exit 1

CMD ["sh", "-lc", "exec uvicorn ${APP_MODULE} --host ${UVICORN_HOST} --port ${PORT} --log-level ${UVICORN_LOG_LEVEL} --proxy-headers --forwarded-allow-ips='*' --workers ${UVICORN_WORKERS} ${UVICORN_RELOAD:+--reload}"]