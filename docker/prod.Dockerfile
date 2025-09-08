# syntax=docker/dockerfile:1.7
ARG PYTHON_VERSION=3.11
FROM --platform=$BUILDPLATFORM python:${PYTHON_VERSION}-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy the whole repo so we don't depend on a specific path for requirements
COPY . /app

# Install deps whether you use requirements.txt or pyproject.toml/poetry
RUN python -m pip install --upgrade pip && \
    if [ -f "requirements.txt" ]; then \
        pip install --no-cache-dir -r requirements.txt; \
    elif [ -f "app/requirements.txt" ]; then \
        pip install --no-cache-dir -r app/requirements.txt; \
    elif [ -f "pyproject.toml" ]; then \
        pip install --no-cache-dir .; \
    else \
        echo "No requirements.txt or pyproject.toml found" >&2; exit 1; \
    fi

# (Optional) Non-root user
RUN useradd -m appuser
USER appuser

EXPOSE 8000
# Update to your real module:callable
CMD ["python", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]