"""add tags to reviews

Revision ID: b1c2d3e4f5g6
Revises: a1b2c3d4e5f6
Create Date: 2026-03-04 12:33:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1c2d3e4f5g6'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tags JSON column to reviews."""
    with op.batch_alter_table('reviews') as batch_op:
        batch_op.add_column(sa.Column('tags', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Remove tags column from reviews."""
    with op.batch_alter_table('reviews') as batch_op:
        batch_op.drop_column('tags')
