"""Add is_active column to TrackLine model

Revision ID: e04df18ae98b
Revises: 66c926914d81
Create Date: 2025-09-10 04:26:15.479975

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e04df18ae98b'
down_revision = '66c926914d81'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add is_active column to trackLines table with default True and non-nullable
    op.add_column('trackLines', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')))

def downgrade() -> None:
    # Remove is_active column from trackLines table
    op.drop_column('trackLines', 'is_active')
