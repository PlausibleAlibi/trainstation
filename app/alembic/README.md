# Alembic Database Migrations

This directory contains Alembic database migrations for the TrainStation project.

## Migration Overview

The database schema includes the following tables managed by these migrations:

### Current Tables (as of latest migration)
- **Categories** - Accessory categories and classification
- **TrackLines** - Railway track line definitions
- **Sections** - Individual track sections within lines  
- **Accessories** - Physical accessories (signals, lights, etc.)
- **Switches** - Railway switches/turnouts with positioning
- **SectionConnections** - Connections between track sections
- **TrainAssets** - Train assets with RFID tracking (Engine, Car, Caboose, etc.)
- **AssetLocationEvents** - Asset location tracking events with timestamps

### Key Features
- All tables use **CamelCase naming convention** for tables and fields
- All tables include proper foreign key relationships
- Indexed fields for optimal query performance
- Boolean flags with appropriate defaults
- Position tracking (x, y, z coordinates) for spatial elements
- RFID-based asset tracking with location event history

## Common Operations

### Run Latest Migrations
```bash
# From project root
./Scripts/migrate.sh up
```

### Check Current Migration Status  
```bash
./Scripts/migrate.sh current
./Scripts/migrate.sh status
```

### Create New Migration
```bash
./Scripts/migrate.sh make "description of changes"
```

### Rollback Migration
```bash
./Scripts/migrate.sh down       # rollback one migration
./Scripts/migrate.sh down -2    # rollback two migrations
```

### Migration History
```bash
./Scripts/migrate.sh history
./Scripts/migrate.sh heads
```

## Migration Files

### 001_initial_camelcase_schema.py
**Base migration** - Creates all core tables with CamelCase naming including:
- Complete Categories, TrackLines, Sections, Accessories tables
- Complete Switches table with all positioning and configuration fields  
- Complete SectionConnections table with routing and bidirectional support
- New TrainAssets table for asset tracking with RFID support
- New AssetLocationEvents table for tracking asset movements
- Proper foreign key relationships and indexes
- All field names follow CamelCase convention (Id, Name, IsActive, etc.)

## Database Schema Notes

### TrainAssets Table
Contains train assets for RFID-based tracking:
- `Id` - Primary key
- `AssetId` - Optional client-readable identifier
- `RfidTagId` - Unique RFID tag identifier (indexed, unique)
- `Type` - Asset type (Engine, Car, Caboose, etc.)
- `RoadNumber` - Railroad asset number (indexed)
- `Description` - Optional descriptive information
- `Active` - Boolean status flag
- `DateAdded` - Timestamp when asset was added

### AssetLocationEvents Table
Tracks asset location history:
- `EventId` - Primary key
- `AssetId` - Foreign key to TrainAssets
- `RfidTagId` - RFID tag detected (indexed)
- `Location` - Reader/zone name where detected
- `ReaderId` - Identifier of the RFID reader (indexed)
- `Timestamp` - When the event occurred (indexed)

### Switches Table
Contains railway switches/turnouts with full configuration:
- Optional `Name` field for switch identification and labeling
- Links to Accessories and Sections via foreign keys
- Includes `Kind` field for switch type (turnout, crossover, etc.)
- Supports `DefaultRoute` for routing configuration
- 3D positioning with orientation angle
- Active status tracking

### SectionConnections Table  
Manages connections between track sections:
- Links sections via `FromSectionId` and `ToSectionId`  
- Optional switch association for switch-controlled connections
- `RouteInfo` field for routing metadata
- `IsBidirectional` flag for connection directionality

## Fresh Database Setup

For a completely new database:
```bash
./Scripts/migrate.sh up
```

This will create all tables and apply all migrations.

## Existing Database Migration

If you have an existing database with old migration history:
```bash
# Check current status first
./Scripts/migrate.sh current

# If needed, stamp to latest migration
./Scripts/migrate.sh stamp head
```

## Important Notes

⚠️ **Migration History**: The project underwent a complete schema refactor to use CamelCase naming conventions. All previous migrations were replaced with a single initial migration.

✅ **CamelCase Convention**: All table names and field names now use CamelCase (Categories, TrainAssets, AssetLocationEvents, etc.)

✅ **New Asset Tracking**: Added TrainAssets and AssetLocationEvents tables for RFID-based train asset tracking.

✅ **Completeness**: All tables are fully defined in migrations with proper relationships, constraints, and indexes.

🔄 **After Pulling Changes**: Always run `./Scripts/migrate.sh up` after pulling changes that may include new migrations.

## API Endpoints

The following REST endpoints are available for the new asset tracking:

- `GET /trainAssets` - List train assets (with optional filtering)
- `POST /trainAssets` - Create new train asset
- `GET /trainAssets/{id}` - Get specific train asset with location events
- `PUT /trainAssets/{id}` - Update train asset
- `DELETE /trainAssets/{id}` - Delete train asset

- `GET /assetLocationEvents` - List location events (with optional filtering)
- `POST /assetLocationEvents` - Create new location event
- `GET /assetLocationEvents/{eventId}` - Get specific location event
- `GET /assetLocationEvents/assets/{assetId}/latest` - Get latest location for asset
- `DELETE /assetLocationEvents/{eventId}` - Delete location event