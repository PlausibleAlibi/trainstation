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
- **Categories** - Accessory categories and classification
- **TrackLines** - Railway track line definitions  
- **Sections** - Individual track sections within lines
- **Accessories** - Physical accessories (signals, lights, etc.)
- **Switches** - Railway switches/turnouts with positioning and routing
- **SectionConnections** - Track section connections with switch integration
- **TrainAssets** - RFID-enabled train assets (engines, cars, cabooses, etc.)
- **AssetLocationEvents** - Real-time asset location tracking with timestamps

## 🏷️ Asset Tracking Features

TrainStation now includes comprehensive RFID-based asset tracking:

### Train Assets
- **Asset Management**: Track engines, cars, cabooses, and other rolling stock
- **RFID Integration**: Each asset linked to unique RFID tag for automated detection
- **Asset Types**: Configurable asset types (Engine, Car, Caboose, Locomotive, FreightCar, PassengerCar)
- **Road Numbers**: Standard railroad asset numbering
- **Status Tracking**: Active/inactive asset status management

### Location Events
- **Real-time Tracking**: Automatic location events when RFID tags are detected
- **Reader Integration**: Support for multiple RFID readers and zones
- **Historical Data**: Complete location history for each asset
- **Timestamp Tracking**: Precise timing of all asset movements

### API Endpoints
- `GET /trainAssets` - List and search assets with filtering options
- `POST /trainAssets` - Add new assets to the system  
- `GET /trainAssets/{id}` - Get asset details with location history
- `GET /assetLocationEvents` - Query location events with filtering
- `GET /assetLocationEvents/assets/{id}/latest` - Get current asset location
- All supporting tables (categories, sections, accessories, trackLines)

See `app/alembic/README.md` for detailed migration documentation.

### Rebuilding

To rebuild all containers (useful after code changes):

```bash
./Scripts/rebuild.sh           # Preserve database
./Scripts/rebuild.sh --clean   # Reset database
```

## 🎛️ Navigation Modes

TrainStation includes a multi-mode frontend with three distinct interfaces for different operational needs.

### Features

- **Triple App Architecture**: Switch between Admin (CRUD operations), Command Center (control operations), and Lab (testing utilities) modes
- **Control Dashboard**: Monitor system status, power state, active trains, and warnings
- **Virtual Track Layout**: Placeholder for future interactive track visualization
- **Lab Testing Suite**: Access to testing and diagnostic tools
- **Shared Components**: Header, footer, and styling shared between all apps
- **Real-time Controls**: Power management and emergency stop functionality (placeholders)

### Navigation Modes

#### Admin Mode
- **Purpose**: Administrative CRUD operations for system configuration
- **Features**: Manage accessories, categories, track lines, sections, switches, and connections
- **Access**: Click the "Admin" button in the header (default mode)

#### Command Center Mode  
- **Purpose**: Real-time control and monitoring of railway operations
- **Features**: Control dashboard, track layout view, system power controls
- **Access**: Click the "Command Center" button in the header

#### Lab Mode
- **Purpose**: Testing and diagnostic utilities for development and troubleshooting
- **Features**: 
  - **Accessory Tester**: Test end-to-end communication between FastAPI backend, ESP32 nodes, and accessory relays
  - Extensible interface for additional lab tools
- **Access**: Click the "Lab" button in the header

### Usage

Navigate between modes by:
1. Navigate to the main application
2. Click the desired mode button in the header: "Admin", "Command Center", or "Lab"
3. The mode is preserved in the URL with `?mode=admin`, `?mode=command-center`, or `?mode=lab`

### Lab Tools

#### Accessory Tester
- **Location**: Available in Lab mode → Accessory Tester tab
- **Function**: Opens `/labtest/accessory_tester.html` in a new tab
- **Purpose**: Test communication with ESP32 nodes and accessory relays
- **Usage**: Demonstrates the mapping defined in `accessory_map.yaml`

### Future Enhancements

The navigation foundation supports future features:
- Additional lab testing tools and diagnostics
- Individual track section controls
- Switch position controls  
- Train speed and direction controls
- Real-time system monitoring
- Interactive track layout visualization
- Historical event logs

## 📁 Project Structure

- `app/` - FastAPI backend code
- `frontend/` - React frontend code with triple app architecture:
  - `src/AdminApp.tsx` - Admin CRUD interface (original functionality)
  - `src/CommandCenter*.tsx` - Command Center control interface
  - `src/LabMain.tsx` - Lab testing and diagnostic interface
  - `src/AppRouter.tsx` - Main router handling app mode switching
  - `shared/` - Shared components, theme, and utilities
- `labtest/` - Lab testing utilities and tools
  - `accessory_tester.html` - Standalone HTML accessory testing interface
  - `AccessoryTester.tsx` - React version of accessory tester
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

## 🧪 Testing

TrainStation includes comprehensive testing setup for both backend and frontend components.

### Backend Testing (Python/FastAPI)

The backend uses pytest for unit testing with coverage reporting.

```bash
# Install test dependencies (if not already installed)
cd /home/runner/work/trainstation/trainstation
pip install -r requirements.txt

# Run all tests
cd app
python -m pytest

# Run tests with coverage
python -m pytest --cov=. --cov-report=html --cov-report=term

# Run specific test files
python -m pytest tests/test_models.py
python -m pytest tests/test_api_endpoints.py
```

#### Backend Test Structure
- `app/tests/` - Test directory
- `app/tests/test_models.py` - Tests for SQLAlchemy models
- `app/tests/test_api_endpoints.py` - Tests for FastAPI endpoints  
- `.coveragerc` - Coverage configuration

Coverage reports are generated in `htmlcov/` directory.

#### Backend Logging

TrainStation backend uses structured logging with `structlog` for comprehensive request monitoring and debugging.

**Logging Features:**
- **Structured JSON Output**: All logs are formatted as JSON for easy parsing and monitoring
- **Request Logging**: Every HTTP request is automatically logged with detailed context
- **Error Tracking**: Unhandled exceptions are logged with full context and stack traces

**Log Data Captured:**
- `event_type`: Type of event ("request" for HTTP requests)
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `path`: Request path (e.g., "/trainAssets", "/categories")
- `query`: Query parameters as string
- `client_ip`: Client IP address (supports proxy headers)
- `status_code`: HTTP response status code
- `processing_time_ms`: Request processing time in milliseconds
- `timestamp`: ISO formatted timestamp
- `level`: Log level (info, error, etc.)
- `logger`: Logger name for identifying log source

**Example Log Output:**
```json
{
  "event_type": "request",
  "method": "GET", 
  "path": "/trainAssets",
  "query": "status=active",
  "client_ip": "127.0.0.1",
  "status_code": 200,
  "processing_time_ms": 23.45,
  "event": "HTTP request processed",
  "level": "info",
  "logger": "request",
  "timestamp": "2025-09-12T04:10:28.552713Z"
}
```

**Configuration:**
- Logging setup: `app/logging_config.py`
- Request middleware: `app/middleware.py`
- All endpoints automatically instrumented via middleware

### Frontend Testing (React/TypeScript)

The frontend uses Vitest with React Testing Library for component testing.

```bash
# Install test dependencies
cd frontend
npm install

# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI (browser-based test runner)
npm run test:ui
```

#### Frontend Test Structure
- `frontend/tests/` - Test directory
- `frontend/tests/App.test.tsx` - Sample App component tests
- `frontend/tests/Dashboard.test.tsx` - Sample Dashboard component tests
- `frontend/tests/setup.ts` - Test setup configuration
- `frontend/vitest.config.ts` - Vitest configuration

Coverage reports are generated in `coverage/` directory.

### Testing Best Practices

- **Backend**: Tests use in-memory SQLite databases for isolation
- **Frontend**: Tests use jsdom for DOM simulation and Material-UI theme providers
- **Coverage**: Both backend and frontend are configured for comprehensive coverage reporting
- **CI/CD Ready**: All test commands work in automated environments

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

## 🎨 UI Consistency Guidelines

TrainStation follows a centralized design system using Material-UI (MUI) v7 to ensure consistent user experience across all components.

### Theme Structure

The centralized theme is located at `frontend/shared/theme/index.ts` and provides:

#### Spacing Scale
```typescript
// Use these standardized spacing values instead of hardcoded numbers
spacing = {
  xs: 4px,   // theme.spacing(0.5)
  sm: 8px,   // theme.spacing(1)  
  md: 16px,  // theme.spacing(2)
  lg: 24px,  // theme.spacing(3)
  xl: 32px,  // theme.spacing(4)
  xxl: 48px, // theme.spacing(6)
}
```

#### Icon Sizes
```typescript
// Standardized icon sizes for consistency
iconSizes = {
  small: 20px,   // For buttons and inline usage
  medium: 24px,  // Default size
  large: 32px,   // For cards and emphasis
  xlarge: 40px,  // For statistics and headers
}
```

#### Button Variants
```typescript
// Use these predefined button combinations
buttonVariants = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'contained', color: 'secondary' },
  success: { variant: 'contained', color: 'success' },
  warning: { variant: 'contained', color: 'warning' },
  error: { variant: 'contained', color: 'error' },
  outline: { variant: 'outlined' },
  text: { variant: 'text' },
}
```

### Usage Guidelines

#### ✅ Do
- **Import theme utilities**: `import { spacing, iconSizes, buttonVariants } from '../shared/theme'`
- **Use spacing constants**: `sx={{ p: spacing.md, mb: spacing.lg }}`
- **Use standardized icons**: `<Icon sx={{ fontSize: iconSizes.medium }} />`
- **Use button variants**: `<Button {...buttonVariants.primary}>Save</Button>`
- **Use theme colors**: `color: 'primary.main'`, `bgcolor: 'background.default'`

#### ❌ Don't
- **Hardcode spacing**: `sx={{ p: 2, mb: 3 }}` → Use `sx={{ p: spacing.md, mb: spacing.lg }}`
- **Hardcode icon sizes**: `fontSize: 40` → Use `fontSize: iconSizes.xlarge`
- **Hardcode colors**: `'rgba(255,255,255,0.2)'` → Use theme colors
- **Repeat button props**: `variant="contained" color="primary"` → Use `{...buttonVariants.primary}`

### Component Patterns

#### Cards and Papers
```typescript
// Consistent card styling
<Card sx={{ p: spacing.lg }}>
  <CardContent>
    <Typography variant="h5" gutterBottom>Title</Typography>
    <Typography color="text.secondary">Content</Typography>
  </CardContent>
</Card>
```

#### Lists with Dividers
```typescript
// Consistent list styling
<List sx={{ p: 0 }}>
  {items.map((item, index) => (
    <React.Fragment key={item.id}>
      <ListItem sx={{ px: 0 }}>
        <ListItemIcon>
          <Icon sx={{ fontSize: iconSizes.medium }} />
        </ListItemIcon>
        <ListItemText primary={item.name} />
      </ListItem>
      {index < items.length - 1 && <Divider />}
    </React.Fragment>
  ))}
</List>
```

#### Responsive Grids
```typescript
// Use theme spacing for consistent gaps
<Box sx={{ 
  display: 'grid', 
  gap: spacing.lg, 
  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } 
}}>
  {/* Grid items */}
</Box>
```

### Future Contributors

When creating new components:
1. Always import and use theme utilities
2. Follow the established spacing and sizing patterns
3. Use semantic color names from the theme palette
4. Ensure responsive design using theme breakpoints
5. Test components across different screen sizes

For questions about UI patterns, refer to existing components like `Dashboard.tsx` and `CommandCenterDashboard.tsx` as reference implementations.