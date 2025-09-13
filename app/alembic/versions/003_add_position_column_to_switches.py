"""Add position column to Switches table

Revision ID: 003_add_position_column_to_switches
Revises: 002_add_connection_type_column
Create Date: 2025-01-15 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_add_position'
down_revision = '002_add_connection_type_column'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add position column to Switches table
    op.add_column('Switches', sa.Column('position', sa.String(length=50), nullable=True))

def downgrade() -> None:
    # Remove position column from Switches table
    op.drop_column('Switches', 'position')