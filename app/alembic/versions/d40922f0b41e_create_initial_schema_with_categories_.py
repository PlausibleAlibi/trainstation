"""Create initial schema with categories and accessories tables

Revision ID: d40922f0b41e
Revises: 
Create Date: 2025-09-09 20:24:00.545581

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd40922f0b41e'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=True)

    # Create accessories table
    op.create_table(
        'accessories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('control_type', sa.String(length=20), nullable=False),
        sa.Column('address', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('timed_ms', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_accessories_id'), 'accessories', ['id'], unique=False)
    op.create_index(op.f('ix_accessories_name'), 'accessories', ['name'], unique=False)

def downgrade() -> None:
    # Drop accessories table first (due to foreign key dependency)
    op.drop_index(op.f('ix_accessories_name'), table_name='accessories')
    op.drop_index(op.f('ix_accessories_id'), table_name='accessories')
    op.drop_table('accessories')
    
    # Drop categories table
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
