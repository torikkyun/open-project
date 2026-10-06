"""Add one-level task subtasks."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004_task_subtasks"
down_revision: Union[str, None] = "0003_user_avatars"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("parent_task_id", sa.Uuid(), nullable=True))
    op.create_foreign_key(
        "fk_tasks_parent_task_id_tasks",
        "tasks",
        "tasks",
        ["parent_task_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_tasks_parent_task_id", "tasks", ["parent_task_id"])


def downgrade() -> None:
    op.drop_index("ix_tasks_parent_task_id", table_name="tasks")
    op.drop_constraint("fk_tasks_parent_task_id_tasks", "tasks", type_="foreignkey")
    op.drop_column("tasks", "parent_task_id")
