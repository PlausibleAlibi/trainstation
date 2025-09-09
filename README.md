# 🚂 TrainStation

A FastAPI backend with React frontend for managing model train operations.

## 🚀 Quick Start

All deployment and development configurations are located in the `deploy/` directory.

### Starting All Services

To start the complete application stack (web backend, frontend, database):

```bash
docker-compose -f deploy/docker-compose.yml up
```

Or use the provided Makefile shortcuts:

```bash
make up      # Start all services in background
make down    # Stop all services  
make logs    # Follow web service logs
make ps      # Show running services
```

### Services

The application runs the following services:

- **Web Backend**: FastAPI application on http://localhost:8080
- **Frontend**: React application on http://localhost:3000  
- **Database**: PostgreSQL database (internal)

### Configuration

1. Copy the sample environment file:
   ```bash
   cp deploy/sample.env deploy/.env
   ```

2. Update `deploy/.env` with your specific configuration if needed.

## 🛠️ Development

### Database Migrations

Use the migration script for database operations:

```bash
./Scripts/migrate.sh up          # Run latest migrations
./Scripts/migrate.sh make "msg"  # Create new migration
./Scripts/migrate.sh status      # Check current state
```

### Rebuilding

To rebuild all containers (useful after code changes):

```bash
./Scripts/rebuild.sh           # Preserve database
./Scripts/rebuild.sh --clean   # Reset database
```

## 📁 Project Structure

- `app/` - FastAPI backend code
- `frontend/` - React frontend code  
- `deploy/` - Docker Compose and deployment configuration
- `Scripts/` - Utility scripts for development
- `docker/` - Dockerfiles and container configuration

## 🔧 Contributing

All Docker Compose operations should use files from the `deploy/` directory. The deployment configuration includes:

- `deploy/docker-compose.yml` - Main compose configuration
- `deploy/.env` - Environment variables
- `deploy/sample.env` - Sample environment configuration

For CI/CD and production deployments, always reference the `deploy/` directory configuration.