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

### Legacy Deployment (Deprecated)

**⚠️ DEPRECATED:** The `deploy/` directory configuration is being phased out. Use the root-level compose files instead:

```bash
make up      # Start all services in background (now uses root compose files)
make down    # Stop all services  
make logs    # Follow api service logs (updated from 'web' to 'api')
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

**⚠️ Important**: Always run migrations after pulling changes:
```bash
git pull
./Scripts/migrate.sh up
```

The current database schema includes full support for:
- **switches** - Railway switches/turnouts with positioning and routing
- **sectionConnections** - Track section connections with switch integration  
- All supporting tables (categories, sections, accessories, trackLines)

See `app/alembic/README.md` for detailed migration documentation.

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

## 🏷️ Automated Version Stamping

TrainStation includes an automated version stamping system that ensures every build includes up-to-date version information displayed in the frontend footer.

### How It Works

1. **Version Script**: `Scripts/stamp_version.sh` generates version metadata
   - Accepts optional tag/version argument: `./Scripts/stamp_version.sh v1.2.3`
   - Defaults to latest git tag or commit hash if no argument provided
   - Writes version info to `version.env` and copies `VITE_` variables to `frontend/.env`

2. **Prebuild Hook**: Frontend automatically runs the version script before building
   - Configured in `frontend/package.json` as a `prebuild` script
   - Runs automatically when you execute `npm run build`

3. **Frontend Display**: Footer component shows version info using Vite environment variables
   - Uses `import.meta.env.VITE_APP_VERSION` and `import.meta.env.VITE_APP_DEPLOYED`
   - Includes fallback values for development mode
   - Automatically formats deployment date for user-friendly display

### Accessing Version Info

**In the Frontend:**
```javascript
// Access version info in any component
const version = import.meta.env.VITE_APP_VERSION || 'dev'
const deployed = import.meta.env.VITE_APP_DEPLOYED || null
```

**Manual Version Stamping:**
```bash
# Stamp with current git info (auto-detects latest tag)
./Scripts/stamp_version.sh

# Stamp with specific version
./Scripts/stamp_version.sh v1.2.3
```

### Generated Files

- `version.env` - Shared environment file with all version variables
- `frontend/.env` - Updated automatically with `VITE_` prefixed variables

This system ensures every build includes accurate version metadata without manual intervention.

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

All Docker Compose operations now use the root-level compose files with override support:
- `docker-compose.yml` - Base configuration  
- `docker-compose.dev.yml` - Development overrides
- `docker-compose.prod.yml` - Production overrides

The `deploy/` directory is deprecated and scheduled for removal.