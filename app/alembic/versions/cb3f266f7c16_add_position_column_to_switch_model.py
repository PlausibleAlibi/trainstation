"""Add position column to Switch model

Revision ID: cb3f266f7c16
Revises: 002_add_connection_type_column
Create Date: 2025-09-13 21:06:17.934491

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'cb3f266f7c16'
down_revision = '002_add_connection_type_column'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add position column to Switches table
    op.add_column('Switches', sa.Column('position', sa.String(length=50), nullable=False, server_default='unknown'))

def downgrade() -> None:
    # Remove position column from Switches table
    op.drop_column('Switches', 'position')
