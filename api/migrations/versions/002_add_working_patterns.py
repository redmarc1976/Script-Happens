"""Add working_patterns table

Revision ID: 002
Revises: 001
Create Date: 2026-05-11 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'working_patterns',
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('monday', sa.String(20), nullable=False),
        sa.Column('tuesday', sa.String(20), nullable=False),
        sa.Column('wednesday', sa.String(20), nullable=False),
        sa.Column('thursday', sa.String(20), nullable=False),
        sa.Column('friday', sa.String(20), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )


def downgrade() -> None:
    op.drop_table('working_patterns')
