# syntax=docker/dockerfile:1.7
ARG PYTHON_VERSION=3.11
FROM --platform=$BUILDPLATFORM python:${PYTHON_VERSION}-slim AS base
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# If you use pyproject.toml, swap these two lines as noted below.
COPY app/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY app /app

RUN useradd -m appuser
USER appuser

EXPOSE 8000
# Update this to your real module:callable
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]