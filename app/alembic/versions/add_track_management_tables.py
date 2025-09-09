"""Add trackLines, sections, switches, and sectionConnections tables

Revision ID: add_track_tables
Revises: d40922f0b41e
Create Date: 2025-01-21 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_track_tables'
down_revision = 'd40922f0b41e'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create track_lines table
    op.create_table(
        'track_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('length', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_track_lines_id'), 'track_lines', ['id'], unique=False)
    op.create_index(op.f('ix_track_lines_name'), 'track_lines', ['name'], unique=False)
    
    # Create sections table
    op.create_table(
        'sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('track_line_id', sa.Integer(), nullable=False),
        sa.Column('start_position', sa.Float(), nullable=True),
        sa.Column('end_position', sa.Float(), nullable=True),
        sa.Column('length', sa.Float(), nullable=True),
        sa.Column('is_occupied', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['track_line_id'], ['track_lines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sections_id'), 'sections', ['id'], unique=False)
    op.create_index(op.f('ix_sections_name'), 'sections', ['name'], unique=False)
    
    # Create switches table
    op.create_table(
        'switches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('accessory_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=False),
        sa.Column('position', sa.String(length=20), nullable=False, server_default=sa.text("'unknown'")),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['accessory_id'], ['accessories.id'], ),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_switches_id'), 'switches', ['id'], unique=False)
    op.create_index(op.f('ix_switches_name'), 'switches', ['name'], unique=False)
    
    # Create section_connections table
    op.create_table(
        'section_connections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('from_section_id', sa.Integer(), nullable=False),
        sa.Column('to_section_id', sa.Integer(), nullable=False),
        sa.Column('connection_type', sa.String(length=20), nullable=False, server_default=sa.text("'direct'")),
        sa.Column('switch_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['from_section_id'], ['sections.id'], ),
        sa.ForeignKeyConstraint(['to_section_id'], ['sections.id'], ),
        sa.ForeignKeyConstraint(['switch_id'], ['switches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_section_connections_id'), 'section_connections', ['id'], unique=False)

def downgrade() -> None:
    # Drop section_connections table first (due to foreign key dependencies)
    op.drop_index(op.f('ix_section_connections_id'), table_name='section_connections')
    op.drop_table('section_connections')
    
    # Drop switches table
    op.drop_index(op.f('ix_switches_name'), table_name='switches')
    op.drop_index(op.f('ix_switches_id'), table_name='switches')
    op.drop_table('switches')
    
    # Drop sections table
    op.drop_index(op.f('ix_sections_name'), table_name='sections')
    op.drop_index(op.f('ix_sections_id'), table_name='sections')
    op.drop_table('sections')
    
    # Drop track_lines table
    op.drop_index(op.f('ix_track_lines_name'), table_name='track_lines')
    op.drop_index(op.f('ix_track_lines_id'), table_name='track_lines')
    op.drop_table('track_lines')