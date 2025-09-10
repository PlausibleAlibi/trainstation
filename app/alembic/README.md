# Alembic Database Migrations

This directory contains Alembic database migrations for the TrainStation project.

## Migration Overview

The database schema includes the following tables managed by these migrations:

### Current Tables (as of latest migration)
- **categories** - Accessory categories and classification
- **trackLines** - Railway track line definitions
- **sections** - Individual track sections within lines  
- **accessories** - Physical accessories (signals, lights, etc.)
- **switches** - Railway switches/turnouts with positioning
- **sectionConnections** - Connections between track sections

### Key Features
- All tables include proper foreign key relationships
- Indexed fields for optimal query performance
- Boolean flags with appropriate defaults
- Position tracking (x, y, z coordinates) for spatial elements

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

### 66c926914d81_initial_schema_with_all_tables.py
**Base migration** - Creates all core tables including:
- Complete switches table with all positioning and configuration fields
- Complete sectionConnections table with routing and bidirectional support
- All supporting tables (categories, trackLines, sections, accessories)
- Proper foreign key relationships and indexes

### e04df18ae98b_add_is_active_column_to_trackline_model.py  
**Enhancement** - Adds `is_active` column to trackLines table for status management

### ac49b6de16f5_add_name_column_to_switches_table.py
**Enhancement** - Adds `name` column to switches table for better switch identification and management

## Database Schema Notes

### Switches Table
Contains railway switches/turnouts with full configuration:
- Optional `name` field for switch identification and labeling
- Links to accessories and sections via foreign keys
- Includes `kind` field for switch type (turnout, crossover, etc.)
- Supports `default_route` for routing configuration
- 3D positioning with orientation angle
- Active status tracking

### Section Connections Table  
Manages connections between track sections:
- Links sections via `from_section_id` and `to_section_id`  
- Optional switch association for switch-controlled connections
- `route_info` field for routing metadata
- `is_bidirectional` flag for connection directionality

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

⚠️ **Migration History**: The project underwent migration cleanup to resolve multiple heads issues. All current migrations are linear and stable.

✅ **Completeness**: Both switches and sectionConnections tables are fully defined in migrations with all required fields, constraints, and indexes.

🔄 **After Pulling Changes**: Always run `./Scripts/migrate.sh up` after pulling changes that may include new migrations.