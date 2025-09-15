"""merge maintenance and position changes

Revision ID: f8e1331480a5
Revises: 003_add_maintenance_fields, 760758064f90
Create Date: 2025-09-15 00:26:51.110955

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f8e1331480a5'
down_revision = ('003_add_maintenance_fields', '760758064f90')
branch_labels = None
depends_on = None

def upgrade() -> None:
    pass

def downgrade() -> None:
    pass
