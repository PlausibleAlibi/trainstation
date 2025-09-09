# 🚂 TrainStation

A FastAPI backend with React frontend for managing model train operations.

## 🚀 Quick Start

TrainStation supports both development and production deployment modes:

### Development Mode (Recommended for Development)

Development mode runs the frontend with Vite dev server for hot module replacement and fast development:

```bash
make dev
# or directly:
./Scripts/dev.sh
```

- **Frontend**: Vite dev server with HMR at http://localhost:3000
- **Backend API**: http://localhost:3000/api (proxied through nginx)
- **Hot reloading** for both frontend and backend changes

### Production Mode

Production mode builds and serves optimized static files:

```bash
make prod
# or directly:
./Scripts/prod.sh
```

- **Frontend**: Built static files served by nginx at http://localhost
- **Backend API**: http://localhost/api (proxied through nginx)
- **Optimized** for performance and caching

### Legacy Deployment (Deploy Directory)

For legacy deployments, all configurations are located in the `deploy/` directory:

```bash
make up      # Start all services in background
make down    # Stop all services  
make logs    # Follow web service logs
make ps      # Show running services
```

## 🏗️ Architecture

TrainStation uses nginx as a reverse proxy to route requests:

- **nginx**: Reverse proxy and static file server (port 80/3000)
- **api**: FastAPI backend (internal port 8000)
- **frontend**: React frontend (Vite dev server on 5173 in dev, static files in prod)
- **db**: PostgreSQL database (internal)

### Services

#### Development Mode
- **nginx**: http://localhost:3000 - Reverse proxy
  - `/api/*` → proxied to `api:8000`
  - `/` → proxied to `frontend:5173` (Vite dev server)

#### Production Mode  
- **nginx**: http://localhost - Reverse proxy and static server
  - `/api/*` → proxied to `api:8000`
  - `/` → serves built files from `frontend/dist`

### Configuration

Environment-specific configurations:
- `.env.dev` - Development environment variables
- `.env.prod` - Production environment variables
- `nginx/nginx.dev.conf` - Development nginx configuration
- `nginx/nginx.prod.conf` - Production nginx configuration

## 🛠️ Development

### Switching Between Modes

```bash
# Stop current mode
make stop

# Start development mode
make dev

# Switch to production mode  
make prod
```

### Validation

Run the validation script to verify the nginx setup:

```bash
./Scripts/validate.sh
```

This script checks all configurations, builds, and provides usage instructions.

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
- `nginx/` - Nginx reverse proxy configurations
- `deploy/` - Docker Compose and deployment configuration
- `Scripts/` - Utility scripts for development
- `docker/` - Dockerfiles and container configuration

### Nginx Configuration Files

- `nginx/nginx.dev.conf` - Development mode (proxies to Vite dev server)
- `nginx/nginx.prod.conf` - Production mode (serves static files)
- `nginx/nginx.deploy.conf` - Legacy deploy configuration

## 🔧 Contributing

### Development Workflow

1. Start development mode: `make dev`
2. Make changes to frontend/backend code
3. Changes are automatically reloaded via HMR
4. Test your changes at http://localhost:3000

### Production Testing

1. Build and test production mode: `make prod`  
2. Test the optimized build at http://localhost
3. Stop and return to dev: `make stop && make dev`

All Docker Compose operations should use files from the `deploy/` directory for legacy deployments. The new dev/prod modes use the root directory configuration with nginx reverse proxy for better development experience.

For CI/CD and production deployments, use the production mode or reference the `deploy/` directory configuration.