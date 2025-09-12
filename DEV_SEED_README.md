# Dev Database Seed Script

This document describes the comprehensive development database seed script for creating a model train layout.

## Overview

The `app/dev_seed.py` script creates a complete model train layout featuring:

- **Oval mainline track** with two sections (East/West)
- **Internal bypass section** for train passing
- **Siding section** for train parking
- **Three switches** with logical SectionConnections
- **Categories** for signals, lights, buildings, and switches
- **Accessories** including a signal, two lights, a house, and switch motors
- **Automatic SectionConnections** to form the complete track graph for routing

## Usage

### 1. Standard Mode (with database)

Run with a real PostgreSQL database connection:

```bash
# From repository root
python app/dev_seed.py

# From app directory
cd app && python dev_seed.py
```

### 2. Test Mode (SQLite in-memory)

For development and validation without a database:

```bash
python app/dev_seed.py --test
```

### 3. Python Code

Use programmatically in your application:

```python
from app.dev_seed import seed_dev_layout

# Standard mode
seed_dev_layout()

# Test mode
seed_dev_layout(test_mode=True)
```

## Generated Layout

### Track Structure

```
     Bypass Section
    ╭─────────────────╮
    │                 │
Mainline East ←──→ Mainline West
    │
    │
Siding Section
```

### Components Created

| Component | Count | Description |
|-----------|-------|-------------|
| Categories | 4 | Signals, Lights, Buildings, Switches |
| Track Lines | 1 | Main Layout |
| Sections | 4 | Mainline East/West, Bypass, Siding |
| Accessories | 7 | 1 signal, 2 lights, 1 house, 3 switch motors |
| Switches | 3 | Entry/Exit for bypass, Siding access |
| Connections | 5 | Complete routing graph |

### Detailed Components

#### Categories
- **Signals** - Track signals and indicators
- **Lights** - Yard and building lights  
- **Buildings** - Animated accessories and structures
- **Switches** - Track turnout motors

#### Sections with Positions
- **Mainline East** (100, 0, 0) - Main track eastern section
- **Mainline West** (-100, 0, 0) - Main track western section
- **Bypass Section** (0, 50, 0) - Internal passing loop
- **Siding Section** (150, -50, 0) - Parking track

#### Accessories
- **Main Signal** (Address: 101) - onOff control at Mainline East
- **Yard Light 1** (Address: 201) - onOff control at Bypass Section
- **Yard Light 2** (Address: 202) - toggle control at Siding Section
- **Station House** (Address: 301) - timed control (5s) at Mainline West
- **Switch 1 Motor** (Address: 401) - toggle control for Bypass Entry
- **Switch 2 Motor** (Address: 402) - toggle control for Bypass Exit
- **Switch 3 Motor** (Address: 403) - toggle control for Siding

#### Switches
- **Bypass Entry Switch** - Turnout at (80, 10, 0), 45° orientation
- **Bypass Exit Switch** - Turnout at (-80, 10, 0), -45° orientation
- **Siding Switch** - Turnout at (120, -20, 0), -30° orientation

#### Section Connections
- Mainline East ↔ Mainline West (direct, bidirectional)
- Mainline East ↔ Bypass Section (via Bypass Entry Switch)
- Bypass Section ↔ Mainline West (via Bypass Exit Switch)
- Mainline East ↔ Siding Section (via Siding Switch)

## Operational Capabilities

The generated layout allows trains to:

1. **Run continuously** on the oval mainline (East ↔ West)
2. **Use the bypass** for overtaking/passing other trains
3. **Park on the siding** section for storage
4. **Switch between routes** using the three turnout switches

## Environment Variables

For database connection (standard mode):

- `DATABASE_URL` - Full database connection string (optional)
- `POSTGRES_USER` - Database user (default: trainsAdmin)
- `POSTGRES_PASSWORD` - Database password (default: brokentrack)
- `POSTGRES_DB` - Database name (default: trains)
- `DB_HOST` - Database host (default: db)
- `DB_PORT` - Database port (default: 5432)

## Files

- `app/dev_seed.py` - Main seed script
- `test_seed_standalone.py` - Standalone test with embedded models
- `DEV_SEED_README.md` - This documentation

## Error Handling

The script includes:
- **Idempotent operations** - Safe to run multiple times
- **Rollback on errors** - All changes are wrapped in a transaction
- **Graceful error handling** - Clear error messages and guidance
- **Test mode fallback** - Works without database for validation

## Integration

The generated data is compatible with:
- The TrainStation web application
- API endpoints for sections, switches, and accessories
- Frontend track visualization components
- Route planning and train control systems