"""Add task table metadata and project issue keys."""

import re
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0005_task_table_fields"
down_revision: Union[str, None] = "0004_task_subtasks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _project_key(name: str, used: set[str]) -> str:
    base = re.sub(r"[^A-Z0-9]", "", name.upper())[:10] or "PROJECT"
    if not base[0].isalpha():
        base = f"P{base}"[:10]
    key = base
    suffix = 2
    while key in used:
        ending = str(suffix)
        key = f"{base[: 10 - len(ending)]}{ending}"
        suffix += 1
    used.add(key)
    return key


def upgrade() -> None:
    op.add_column("projects", sa.Column("project_key", sa.String(length=10)))
    op.add_column(
        "projects",
        sa.Column("next_task_number", sa.Integer(), nullable=True),
    )
    op.add_column("tasks", sa.Column("task_number", sa.Integer(), nullable=True))
    op.add_column(
        "tasks", sa.Column("start_at", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column("tasks", sa.Column("priority", sa.String(length=20), nullable=True))
    op.add_column("tasks", sa.Column("position", sa.Float(), nullable=True))
    op.add_column("tasks", sa.Column("reporter_id", sa.Uuid(), nullable=True))

    connection = op.get_bind()
    projects_table = sa.table(
        "projects",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("project_key", sa.String()),
        sa.column("next_task_number", sa.Integer()),
    )
    tasks_table = sa.table(
        "tasks",
        sa.column("id", sa.Uuid()),
        sa.column("project_id", sa.Uuid()),
        sa.column("created_by", sa.Uuid()),
        sa.column("task_number", sa.Integer()),
        sa.column("position", sa.Float()),
        sa.column("priority", sa.String()),
        sa.column("reporter_id", sa.Uuid()),
        sa.column("created_at", sa.DateTime(timezone=True)),
    )
    projects = connection.execute(
        sa.select(projects_table.c.id, projects_table.c.name).order_by(
            projects_table.c.id
        )
    ).mappings()
    used_keys: set[str] = set()
    project_ids = []
    for project in projects:
        project_id = project["id"]
        project_ids.append(project_id)
        connection.execute(
            sa.update(projects_table)
            .where(projects_table.c.id == project_id)
            .values(project_key=_project_key(project["name"], used_keys))
        )

    for project_id in project_ids:
        tasks = connection.execute(
            sa.select(tasks_table.c.id, tasks_table.c.created_by)
            .where(tasks_table.c.project_id == project_id)
            .order_by(tasks_table.c.created_at, tasks_table.c.id)
        ).mappings()
        task_number = 0
        for task in tasks:
            task_number += 1
            connection.execute(
                sa.update(tasks_table)
                .where(tasks_table.c.id == task["id"])
                .values(
                    task_number=task_number,
                    position=float(task_number),
                    priority="none",
                    reporter_id=task["created_by"],
                )
            )
        connection.execute(
            sa.update(projects_table)
            .where(projects_table.c.id == project_id)
            .values(next_task_number=task_number)
        )

    with op.batch_alter_table("projects") as batch_op:
        batch_op.alter_column("project_key", nullable=False)
        batch_op.alter_column(
            "next_task_number",
            existing_type=sa.Integer(),
            nullable=False,
            server_default="0",
        )
        batch_op.create_unique_constraint(
            "uq_projects_project_key", ["project_key"]
        )

    with op.batch_alter_table("tasks") as batch_op:
        batch_op.alter_column("task_number", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("position", existing_type=sa.Float(), nullable=False)
        batch_op.alter_column(
            "position", existing_type=sa.Float(), server_default="0"
        )
        batch_op.alter_column(
            "priority",
            existing_type=sa.String(length=20),
            nullable=False,
            server_default="none",
        )
        batch_op.alter_column("reporter_id", existing_type=sa.Uuid(), nullable=False)
        batch_op.create_foreign_key(
            "fk_tasks_reporter_id_users",
            "users",
            ["reporter_id"],
            ["id"],
            ondelete="RESTRICT",
        )
        batch_op.create_unique_constraint(
            "uq_tasks_project_task_number", ["project_id", "task_number"]
        )
        batch_op.create_check_constraint(
            "ck_tasks_priority",
            "priority IN ('none', 'low', 'medium', 'high', 'highest')",
        )


def downgrade() -> None:
    with op.batch_alter_table("tasks") as batch_op:
        batch_op.drop_constraint("ck_tasks_priority", type_="check")
        batch_op.drop_constraint("uq_tasks_project_task_number", type_="unique")
        batch_op.drop_constraint("fk_tasks_reporter_id_users", type_="foreignkey")
        batch_op.drop_column("reporter_id")
        batch_op.drop_column("position")
        batch_op.drop_column("priority")
        batch_op.drop_column("start_at")
        batch_op.drop_column("task_number")

    with op.batch_alter_table("projects") as batch_op:
        batch_op.drop_constraint("uq_projects_project_key", type_="unique")
        batch_op.drop_column("next_task_number")
        batch_op.drop_column("project_key")
