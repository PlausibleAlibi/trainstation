# Alembic Migration History Cleanup

This document explains the migration history cleanup that was performed to resolve the "multiple heads" issue in Alembic.

## Problem

The repository had a complex, branched migration history with multiple heads and merge conflicts:

- `d40922f0b41e` - Initial schema (categories, accessories)
- `add_track_tables` - Track management tables (revises: d40922f0b41e) 
- `f714679db2b0` - Also track tables but different naming (revises: d40922f0b41e)
- `a62719bf970c` - Merge migration for both branches
- `merge_add_track_tables_and_f714679db2b0` - Another merge attempt
- `add_is_active_switch` - Additional column (revises: f714679db2b0)

This caused Alembic "multiple heads" errors and made future migrations unsafe.

## Solution

**Replaced all migrations with a single initial migration**: `66c926914d81_initial_schema_with_all_tables.py`

### What was removed:
- 6 complex migration files with branching/merging
- Inconsistent table naming between parallel migrations
- Empty merge migrations that did no database work

### What was created:
- **Single initial migration** that creates all 6 tables:
  - `categories` (id, name, description, sort_order)
  - `trackLines` (id, name, description) 
  - `sections` (id, name, trackLine_id, position_x/y/z, is_active)
  - `accessories` (id, name, category_id, control_type, address, is_active, timed_ms, section_id)
  - `switches` (id, accessory_id, section_id, kind, default_route, orientation, position_x/y/z, is_active)
  - `sectionConnections` (id, from_section_id, to_section_id, switch_id, route_info, is_bidirectional)

## Usage

### For new databases:
```bash
./Scripts/migrate.sh up
```

### For existing databases with old migration history:
You'll need to stamp the database to the new migration:
```bash
./Scripts/migrate.sh stamp 66c926914d81
```

### Future migrations:
Now that the history is linear, new migrations will work normally:
```bash
./Scripts/migrate.sh make "your migration description"
./Scripts/migrate.sh up
```

## Verification

The new migration was tested to ensure:
- ✅ Creates all 6 tables correctly
- ✅ All foreign key relationships work
- ✅ Default values match model definitions
- ✅ Both upgrade() and downgrade() functions work
- ✅ No more "multiple heads" errors
- ✅ Linear migration history for future changes

## Benefits

1. **No more multiple heads errors**
2. **Linear, predictable migration history**
3. **Safe future migrations**
4. **Matches current SQLAlchemy models exactly**
5. **Clean starting point for the project**