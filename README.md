# TrainStation Docker Multi-Environment Setup

This repository now supports three distinct deployment environments using Docker Compose:

## Quick Start

### Development Environment
```bash
make dev-up      # Start development environment
make dev-logs    # View logs
make dev-down    # Stop development environment
```
- **URL:** http://localhost:8080
- **Database:** Exposed on port 5432 for development tools
- **Features:** Live code reloading, debug logging, relaxed health checks

### QA Environment  
```bash
make qa-up       # Start QA environment
make qa-logs     # View logs  
make qa-down     # Stop QA environment
```
- **URL:** http://localhost:8080 (isolated using project name `trainstation-qa`)
- **Database:** Exposed on port 5433 for testing tools
- **Features:** Production-like setup with 2 workers, testing configurations

### Production Environment
```bash
export POSTGRES_PASSWORD="your-secure-password"
make prod-up     # Start production environment
make prod-logs   # View logs
make prod-down   # Stop production environment
```
- **URL:** http://localhost:8080 (isolated using project name `trainstation-prod`)
- **Database:** NOT exposed externally (security)
- **Features:** 4 workers, resource limits, strict health checks, minimal logging

## Environment Isolation

Each environment is isolated using:
- **Separate Docker Compose projects** (`trainstation`, `trainstation-qa`, `trainstation-prod`)
- **Separate databases** (`trains_dev`, `trains_qa`, `trains_prod`)
- **Separate Docker volumes** (`dbdata_dev`, `dbdata_qa`, `dbdata_prod`)
- **Environment-specific configurations** (`.env.dev`, `.env.qa`, `.env.prod`)

This means you can safely switch between environments without data conflicts:
```bash
make dev-down && make qa-up    # Switch from dev to QA
make qa-down && make prod-up   # Switch from QA to production
```

## Files Structure

### Docker Compose Files
- `docker-compose.yml` - Base configuration (shared settings)
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.qa.yml` - QA overrides  
- `docker-compose.prod.yml` - Production overrides
- `docker-compose.override.local.yml` - Legacy local development (still works)

### Environment Files  
- `.env` - Legacy environment variables (used by base configuration)
- `.env.dev` - Development environment variables
- `.env.qa` - QA environment variables
- `.env.prod` - Production environment variables (set POSTGRES_PASSWORD!)

### Documentation
- `DEPLOY.md` - Comprehensive deployment guide with detailed usage instructions
- `Makefile` - Updated with environment-specific commands

## Key Features

### Development Environment
- ✅ **Live Code Reloading**: Source code mounted as volume
- ✅ **Debug Logging**: Full debug output for development
- ✅ **Database Access**: PostgreSQL accessible on port 5432
- ✅ **Relaxed Health Checks**: Faster startup, more forgiving timeouts
- ✅ **Local Image Building**: Builds from local source code

### QA Environment
- ✅ **Production-like Setup**: Uses built images, not live code
- ✅ **2 Uvicorn Workers**: Load testing capability
- ✅ **Separate Database**: Isolated QA data on port 5433
- ✅ **Testing Features**: TEST_DATABASE_URL and TESTING=true
- ✅ **Info Level Logging**: Appropriate for QA debugging

### Production Environment
- ✅ **Registry Images**: Uses pre-built images from GHCR
- ✅ **4 Uvicorn Workers**: Production performance
- ✅ **Resource Limits**: Memory limits and reservations
- ✅ **Security Focused**: No exposed database, HTTPS settings
- ✅ **Strict Health Checks**: Fast failure detection
- ✅ **Minimal Logging**: Warning level only

## Legacy Support

The original development setup still works:
```bash
make up      # Start legacy development setup  
make down    # Stop legacy development setup
make logs    # View legacy logs
```

## Database Management

Each environment has its own database:
- **Development**: `postgresql://trainsAdmin:devpassword@localhost:5432/trains_dev`
- **QA**: `postgresql://trainsAdmin:qapassword@localhost:5433/trains_qa`  
- **Production**: Database not exposed externally

### Database Reset (Development/QA Only)
```bash
make dev-reset-db    # Reset development database
make qa-reset-db     # Reset QA database
# Note: No production reset command for safety
```

## Security Considerations

### Development
- Default passwords (acceptable for local dev)
- Database exposed (needed for development tools)
- Debug logging enabled

### QA  
- Separate passwords from production
- Database exposed on non-standard port for testing
- Info level logging for debugging

### Production
- **REQUIRES** secure password via `POSTGRES_PASSWORD` environment variable
- Database NOT exposed externally
- Resource limits prevent resource exhaustion  
- Minimal logging to reduce information leakage
- HTTPS and secure cookie settings

## Troubleshooting

### Check Service Status
```bash
docker compose ps                           # Current environment
docker compose -p trainstation-qa ps       # QA environment
docker compose -p trainstation-prod ps     # Production environment
```

### View Logs
```bash
make dev-logs    # Development logs
make qa-logs     # QA logs
make prod-logs   # Production logs
```

### Clean Up
```bash
make clean       # Remove unused Docker resources
```

### Port Conflicts
All environments use port 8080 by default, but they're isolated by project names. Only run one environment at a time, or see `DEPLOY.md` for advanced multi-environment setup.

## CI/CD Integration

### Required Environment Variables
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
make qa-up

# Production deployment  
POSTGRES_PASSWORD=secure IMAGE_TAG=v1.0.0 make prod-up
```

For more detailed information, see `DEPLOY.md`.