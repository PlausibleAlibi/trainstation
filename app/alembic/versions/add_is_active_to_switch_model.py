"""Add is_active column to switches table

Revision ID: add_is_active_switch
Revises: f714679db2b0
Create Date: 2025-01-27 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_is_active_switch'
down_revision = 'f714679db2b0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add is_active column to switches table"""
    op.add_column('switches', sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    """Remove is_active column from switches table"""
    op.drop_column('switches', 'is_active')