"""Add track lines, sections, and switches

Revision ID: f714679db2b0
Revises: d40922f0b41e
Create Date: 2025-09-09 23:45:35.772633

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f714679db2b0'
down_revision = 'd40922f0b41e'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create trackLines table
    op.create_table(
        'trackLines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trackLines_id'), 'trackLines', ['id'], unique=False)
    op.create_index(op.f('ix_trackLines_name'), 'trackLines', ['name'], unique=True)

    # Create sections table
    op.create_table(
        'sections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('trackLine_id', sa.Integer(), nullable=False),
        sa.Column('position_x', sa.Float(), nullable=True),
        sa.Column('position_y', sa.Float(), nullable=True),
        sa.Column('position_z', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['trackLine_id'], ['trackLines.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sections_id'), 'sections', ['id'], unique=False)
    op.create_index(op.f('ix_sections_trackLine_id'), 'sections', ['trackLine_id'], unique=False)
    # Create composite unique constraint for name per trackLine
    op.create_index('ix_sections_name_trackline_unique', 'sections', ['name', 'trackLine_id'], unique=True)

    # Add nullable sectionId column to accessories table
    op.add_column('accessories', sa.Column('section_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_accessories_section_id', 'accessories', 'sections', ['section_id'], ['id'])
    op.create_index(op.f('ix_accessories_section_id'), 'accessories', ['section_id'], unique=False)

    # Create switches table
    op.create_table(
        'switches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('accessory_id', sa.Integer(), nullable=False),
        sa.Column('section_id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(length=50), nullable=False),  # Type of switch (turnout, crossover, etc.)
        sa.Column('default_route', sa.String(length=50), nullable=True),  # Default routing state
        sa.Column('orientation', sa.Float(), nullable=True),  # Orientation angle in degrees
        sa.Column('position_x', sa.Float(), nullable=True),
        sa.Column('position_y', sa.Float(), nullable=True),
        sa.Column('position_z', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['accessory_id'], ['accessories.id'], ),
        sa.ForeignKeyConstraint(['section_id'], ['sections.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_switches_id'), 'switches', ['id'], unique=False)
    op.create_index(op.f('ix_switches_accessory_id'), 'switches', ['accessory_id'], unique=False)
    op.create_index(op.f('ix_switches_section_id'), 'switches', ['section_id'], unique=False)

    # Create sectionConnections table
    op.create_table(
        'sectionConnections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('from_section_id', sa.Integer(), nullable=False),
        sa.Column('to_section_id', sa.Integer(), nullable=False),
        sa.Column('switch_id', sa.Integer(), nullable=True),  # Optional switch for this connection
        sa.Column('route_info', sa.String(length=255), nullable=True),  # Routing information
        sa.Column('is_bidirectional', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['from_section_id'], ['sections.id'], ),
        sa.ForeignKeyConstraint(['to_section_id'], ['sections.id'], ),
        sa.ForeignKeyConstraint(['switch_id'], ['switches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sectionConnections_id'), 'sectionConnections', ['id'], unique=False)
    op.create_index(op.f('ix_sectionConnections_from_section_id'), 'sectionConnections', ['from_section_id'], unique=False)
    op.create_index(op.f('ix_sectionConnections_to_section_id'), 'sectionConnections', ['to_section_id'], unique=False)
    op.create_index(op.f('ix_sectionConnections_switch_id'), 'sectionConnections', ['switch_id'], unique=False)

def downgrade() -> None:
    # Drop sectionConnections table
    op.drop_index(op.f('ix_sectionConnections_switch_id'), table_name='sectionConnections')
    op.drop_index(op.f('ix_sectionConnections_to_section_id'), table_name='sectionConnections')
    op.drop_index(op.f('ix_sectionConnections_from_section_id'), table_name='sectionConnections')
    op.drop_index(op.f('ix_sectionConnections_id'), table_name='sectionConnections')
    op.drop_table('sectionConnections')
    
    # Drop switches table
    op.drop_index(op.f('ix_switches_section_id'), table_name='switches')
    op.drop_index(op.f('ix_switches_accessory_id'), table_name='switches')
    op.drop_index(op.f('ix_switches_id'), table_name='switches')
    op.drop_table('switches')
    
    # Remove sectionId column from accessories table
    op.drop_index(op.f('ix_accessories_section_id'), table_name='accessories')
    op.drop_constraint('fk_accessories_section_id', 'accessories', type_='foreignkey')
    op.drop_column('accessories', 'section_id')
    
    # Drop sections table
    op.drop_index('ix_sections_name_trackline_unique', table_name='sections')
    op.drop_index(op.f('ix_sections_trackLine_id'), table_name='sections')
    op.drop_index(op.f('ix_sections_id'), table_name='sections')
    op.drop_table('sections')
    
    # Drop trackLines table
    op.drop_index(op.f('ix_trackLines_name'), table_name='trackLines')
    op.drop_index(op.f('ix_trackLines_id'), table_name='trackLines')
    op.drop_table('trackLines')