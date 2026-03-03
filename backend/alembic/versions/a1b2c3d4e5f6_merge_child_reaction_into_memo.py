"""merge child_reaction into memo

Revision ID: a1b2c3d4e5f6
Revises: d91d99b52a3f
Create Date: 2026-03-04 12:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd91d99b52a3f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge child_reaction into memo, then drop child_reaction."""
    # Migrate data: append child_reaction to memo if child_reaction is non-empty
    conn = op.get_bind()
    conn.execute(sa.text(
        "UPDATE reviews SET memo = CASE "
        "  WHEN (child_reaction IS NOT NULL AND child_reaction != '' AND memo IS NOT NULL AND memo != '') "
        "    THEN memo || '\n\n' || child_reaction "
        "  WHEN (child_reaction IS NOT NULL AND child_reaction != '') "
        "    THEN child_reaction "
        "  ELSE memo "
        "END"
    ))

    # Drop child_reaction column (SQLite requires batch mode)
    with op.batch_alter_table('reviews') as batch_op:
        batch_op.drop_column('child_reaction')


def downgrade() -> None:
    """Re-add child_reaction column (data cannot be restored)."""
    with op.batch_alter_table('reviews') as batch_op:
        batch_op.add_column(sa.Column('child_reaction', sa.String(), nullable=True, server_default=''))
