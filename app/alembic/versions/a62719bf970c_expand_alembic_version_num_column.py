"""Expand alembic_version.version_num column to VARCHAR(128)

Revision ID: a62719bf970c
Revises: add_track_tables, f714679db2b0
Create Date: 2025-01-21 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a62719bf970c'
down_revision = ('add_track_tables', 'f714679db2b0')
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Expand the alembic_version.version_num column to VARCHAR(128)
    # to accommodate longer revision IDs from branch merges
    op.alter_column('alembic_version', 'version_num',
                   type_=sa.String(128),
                   existing_type=sa.String(32),
                   nullable=False)


def downgrade() -> None:
    # Revert the alembic_version.version_num column back to VARCHAR(32)
    # Note: This may fail if there are version numbers longer than 32 characters
    op.alter_column('alembic_version', 'version_num',
                   type_=sa.String(32),
                   existing_type=sa.String(128),
                   nullable=False)