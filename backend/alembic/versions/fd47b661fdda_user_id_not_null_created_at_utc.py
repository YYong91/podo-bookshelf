"""user_id NOT NULL + created_at UTC

Revision ID: fd47b661fdda
Revises: b1c2d3e4f5g6
Create Date: 2026-03-23 13:48:17.315215

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fd47b661fdda'
down_revision: Union[str, Sequence[str], None] = 'b1c2d3e4f5g6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema — SQLite 호환 batch mode 사용."""
    # SQLite는 ALTER COLUMN을 지원하지 않으므로 batch mode로 테이블 재생성
    with op.batch_alter_table('books') as batch_op:
        batch_op.alter_column('user_id',
                   existing_type=sa.BIGINT(),
                   nullable=False)

    with op.batch_alter_table('reviews') as batch_op:
        batch_op.alter_column('user_id',
                   existing_type=sa.BIGINT(),
                   nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('reviews') as batch_op:
        batch_op.alter_column('user_id',
                   existing_type=sa.BIGINT(),
                   nullable=True)

    with op.batch_alter_table('books') as batch_op:
        batch_op.alter_column('user_id',
                   existing_type=sa.BIGINT(),
                   nullable=True)
