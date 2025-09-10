"""Merge heads: add_track_tables and f714679db2b0

Revision ID: merge_add_track_tables_and_f714679db2b0
Revises: add_track_tables, f714679db2b0
Create Date: 2025-09-10 02:05:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'merge_add_track_tables_and_f714679db2b0'
down_revision = ('add_track_tables', 'f714679db2b0')
branch_labels = None
depends_on = None

def upgrade():
    pass  # This migration only merges branches, no DB changes.

def downgrade():
    pass  # Downgrade does nothing.