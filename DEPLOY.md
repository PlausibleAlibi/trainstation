# TrainStation Deployment Guide

This guide explains how to deploy TrainStation in different environments using Docker Compose.

## Overview

TrainStation supports three deployment environments:
- **Development** (`dev`): Local development with live code reloading
- **QA** (`qa`): Testing environment with production-like settings
- **Production** (`prod`): Production deployment with optimized settings

## Quick Start

### Development Environment
```bash
# Start development environment
make dev-up

# View logs
make dev-logs

# Stop development environment
make dev-down
```

### QA Environment
```bash
# Start QA environment
make qa-up

# View logs
make qa-logs

# Stop QA environment
make qa-down
```

### Production Environment
```bash
# Set required environment variables
export POSTGRES_PASSWORD="your-secure-password"
export IMAGE_TAG="v1.0.0"

# Start production environment
make prod-up

# View logs
make prod-logs

# Stop production environment (use with caution!)
make prod-down
```

## Environment Details

### Development Environment

**Configuration Files:**
- `docker-compose.yml` (base configuration)
- `docker-compose.dev.yml` (development overrides)
- `.env.dev` (development environment variables)

**Features:**
- Local code mounting for live reloading
- Debug logging enabled
- Database exposed on port 5432 for development tools
- Relaxed health checks
- Web service on port 8080

**Usage:**
```bash
# Manual Docker Compose usage
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# View all services
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps

# Follow logs for web service
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f web
```

### QA Environment

**Configuration Files:**
- `docker-compose.yml` (base configuration)
- `docker-compose.qa.yml` (QA overrides)
- `.env.qa` (QA environment variables)

**Features:**
- Production-like image building
- 2 Uvicorn workers for load testing
- Separate QA database
- Database exposed on port 5433 for testing tools
- Web service on port 8081
- Optional test runner service (commented out by default)

**Usage:**
```bash
# Manual Docker Compose usage
docker compose -f docker-compose.yml -f docker-compose.qa.yml up -d --build

# Run tests (if test service is uncommented)
docker compose -f docker-compose.yml -f docker-compose.qa.yml --profile test up test-runner

# Reset QA database
make qa-reset-db
```

### Production Environment

**Configuration Files:**
- `docker-compose.yml` (base configuration)
- `docker-compose.prod.yml` (production overrides)
- `.env.prod` (production environment variables)

**Features:**
- Uses registry images (no local building)
- 4 Uvicorn workers for performance
- Resource limits and reservations
- Strict health checks
- Database NOT exposed externally
- Web service on port 8082
- Always restart policy
- Security-focused configuration

**Usage:**
```bash
# Set required environment variables
export POSTGRES_PASSWORD="your-very-secure-password"
export IMAGE_TAG="v1.0.0"  # or latest
export SENTRY_DSN="your-sentry-dsn"  # optional

# Manual Docker Compose usage
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Pull latest images without rebuilding
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
```

## Environment Variables

### Required for Production
- `POSTGRES_PASSWORD`: Secure database password
- `IMAGE_TAG`: Specific image version to deploy

### Optional for Production
- `SENTRY_DSN`: Error monitoring service DSN
- `GIT_COMMIT`: Git commit hash for version tracking
- `BUILT_AT`: Build timestamp

## Database Management

Each environment uses a separate database and volume:
- Development: `trains_dev` (volume: `dbdata_dev`)
- QA: `trains_qa` (volume: `dbdata_qa`)  
- Production: `trains_prod` (volume: `dbdata_prod`)

### Database Access

**Development:** Database accessible at `localhost:5432`
```bash
psql -h localhost -p 5432 -U trainsAdmin -d trains_dev
```

**QA:** Database accessible at `localhost:5433`
```bash
psql -h localhost -p 5433 -U trainsAdmin -d trains_qa
```

**Production:** Database NOT exposed externally (security)

### Database Reset (Development/QA Only)
```bash
# Reset development database
make dev-reset-db

# Reset QA database  
make qa-reset-db
```

## Service Endpoints

Each environment uses the same port mapping (8080:8000) but they are isolated using Docker Compose project names:

- **Development:** http://localhost:8080 (project: `trainstation`)
- **QA:** http://localhost:8080 (project: `trainstation-qa`)  
- **Production:** http://localhost:8080 (project: `trainstation-prod`)

**Important:** Only one environment should be running at a time on port 8080. Use the make commands to switch between environments.

### Running Multiple Environments Simultaneously

If you need to run multiple environments at the same time, you'll need to modify the port mapping manually:

```bash
# Start development environment (uses port 8080)
make dev-up

# In another terminal, start QA on a different port
docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa up -d --build
# Then manually map QA to port 8081
docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa stop web
docker compose -f docker-compose.yml -f docker-compose.qa.yml -p trainstation-qa run --rm -d -p 8081:8000 --name qa-web web

# QA would then be available at: http://localhost:8081
```

### Switching Between Environments

```bash
# Stop current environment  
make dev-down  # or qa-down, prod-down

# Start different environment
make qa-up     # or dev-up, prod-up
```

### Health Checks
All environments provide health check endpoints:
- `GET /health` - Basic health status
- `GET /version` - Version and build information

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check service status
docker compose ps

# View detailed logs
make dev-logs  # or qa-logs, prod-logs

# Check Docker system resources
docker system df
```

**Database connection issues:**
```bash
# Check if database is ready
docker compose exec db pg_isready -U trainsAdmin

# Check database logs
docker compose logs db
```

**Image build issues:**
```bash
# Clean build cache
make clean

# Rebuild from scratch
docker compose build --no-cache
```

### Port Conflicts
If you get port binding errors, check what's using the ports:
```bash
# Check what's using port 8080 (development)
lsof -i :8080

# Check what's using port 5432 (development DB)
lsof -i :5432
```

## Security Considerations

### Development
- Default passwords are used (acceptable for local development)
- Database is exposed for development tools
- Debug logging enabled

### QA
- Uses separate passwords from production
- Database exposed on non-standard port for testing
- Logging level appropriate for debugging

### Production
- **MUST** override `POSTGRES_PASSWORD` with secure value
- Database not exposed externally
- Resource limits prevent resource exhaustion
- Minimal logging to reduce information leakage
- HTTPS and secure cookie settings

## CI/CD Integration

### Environment Variables to Set
```bash
# For QA deployments
export GIT_COMMIT=$(git rev-parse HEAD)
export BUILT_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# For production deployments (additionally)
export IMAGE_TAG="v1.0.0"
export POSTGRES_PASSWORD="$(get-secret postgres-password)"
export SENTRY_DSN="$(get-secret sentry-dsn)"
```

### Deployment Commands
```bash
# QA deployment
docker compose -f docker-compose.yml -f docker-compose.qa.yml up -d --build

# Production deployment
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Legacy Support

The original local development setup is still available:
```bash
# Legacy commands (still work)
make up    # Uses docker-compose.override.local.yml
make down
make logs
```

For new development, prefer the new `dev-*` commands:
```bash
make dev-up
make dev-down
make dev-logs
```