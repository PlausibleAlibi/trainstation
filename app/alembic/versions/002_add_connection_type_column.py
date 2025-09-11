"""Add connection_type and IsActive columns to SectionConnections table

Revision ID: 002_add_connection_type_column
Revises: 001_initial_camelcase_schema
Create Date: 2025-01-13 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_connection_type_column'
down_revision = '001_initial_camelcase_schema'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add connection_type column to SectionConnections table
    op.add_column('SectionConnections', sa.Column('connection_type', sa.String(length=50), nullable=False, server_default='direct'))
    # Add IsActive column to SectionConnections table
    op.add_column('SectionConnections', sa.Column('IsActive', sa.Boolean(), nullable=False, server_default=sa.text('true')))

def downgrade() -> None:
    # Remove columns from SectionConnections table
    op.drop_column('SectionConnections', 'IsActive')
    op.drop_column('SectionConnections', 'connection_type')