"""add_length_column_to_section_model

Revision ID: 760758064f90
Revises: cb3f266f7c16
Create Date: 2025-09-14 22:50:56.998433

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '760758064f90'
down_revision = 'cb3f266f7c16'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Add Length column to Sections table
    op.add_column('Sections', sa.Column('Length', sa.Float(), nullable=True))

def downgrade() -> None:
    # Remove Length column from Sections table
    op.drop_column('Sections', 'Length')
