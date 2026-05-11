"""Initial schema: desks, users, bookings

Revision ID: 001
Revises:
Create Date: 2026-05-11 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'preferences',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    op.create_table(
        'desks',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('location', sa.String(100), nullable=False),
        sa.Column('floor', sa.String(20), nullable=False),
        sa.Column('neighbourhood', sa.String(100), nullable=False),
        sa.Column('x', sa.Float(), nullable=False),
        sa.Column('y', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table(
        'users',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('employee_id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('upn', sa.String(255), nullable=True),
        sa.Column('location', sa.String(100), nullable=False),
        sa.Column('team', sa.String(100), nullable=False),
        sa.Column('role', sa.String(100), nullable=False),
        sa.Column('line_manager_name', sa.String(255), nullable=True),
        sa.Column('line_manager_email', sa.String(255), nullable=True),
        sa.Column('anchor_days', sa.JSON(), nullable=True),
        sa.Column('default_working_pattern', sa.JSON(), nullable=True),
        sa.Column('preferred_neighbourhood', sa.String(100), nullable=True),
        sa.Column('desk_preferences', sa.JSON(), nullable=True),
        sa.Column('booking_window_days', sa.Integer(), nullable=False, server_default='14'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('employee_id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('upn')
    )

    op.create_table(
        'bookings',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('desk_id', sa.String(100), nullable=False),
        sa.Column('booking_date', sa.String(10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['desk_id'], ['desks.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('ix_bookings_user_id', 'bookings', ['user_id'])
    op.create_index('ix_bookings_desk_id', 'bookings', ['desk_id'])

    op.create_table(
        'holidays',
        sa.Column('id', sa.String(100), nullable=False),
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('start_date', sa.String(10), nullable=False),
        sa.Column('end_date', sa.String(10), nullable=False),
        sa.Column('holiday_type', sa.String(50), nullable=False),
        sa.Column('approved', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('notes', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_index('ix_holidays_user_id', 'holidays', ['user_id'])

    op.create_table(
        'desk_preferences',
        sa.Column('desk_id', sa.String(100), nullable=False),
        sa.Column('preference_id', sa.String(100), nullable=False),
        sa.ForeignKeyConstraint(['desk_id'], ['desks.id'], ),
        sa.ForeignKeyConstraint(['preference_id'], ['preferences.id'], ),
        sa.PrimaryKeyConstraint('desk_id', 'preference_id')
    )

    op.create_table(
        'user_preferences',
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('preference_id', sa.String(100), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['preference_id'], ['preferences.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'preference_id')
    )


def downgrade() -> None:
    op.drop_table('user_preferences')
    op.drop_table('desk_preferences')
    op.drop_index('ix_holidays_user_id', table_name='holidays')
    op.drop_table('holidays')
    op.drop_index('ix_bookings_desk_id', table_name='bookings')
    op.drop_index('ix_bookings_user_id', table_name='bookings')
    op.drop_table('bookings')
    op.drop_table('users')
    op.drop_table('desks')
    op.drop_table('preferences')
