"""Add name column to switches table

Revision ID: ac49b6de16f5
Revises: e04df18ae98b
Create Date: 2025-01-14 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ac49b6de16f5'
down_revision = 'e04df18ae98b'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add name column to switches table
    op.add_column('switches', sa.Column('name', sa.String(length=100), nullable=True))
    op.create_index(op.f('ix_switches_name'), 'switches', ['name'], unique=False)

def downgrade() -> None:
    # Remove index and name column from switches table
    op.drop_index(op.f('ix_switches_name'), table_name='switches')
    op.drop_column('switches', 'name')