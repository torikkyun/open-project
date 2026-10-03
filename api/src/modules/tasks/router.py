from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.modules.auth.dependencies import get_current_user
from src.modules.projects.service import require_project_member, require_project_user
from src.modules.tasks.models import Comment, Task
from src.modules.tasks.schema import (
    CommentCreate,
    CommentRead,
    TaskCreate,
    TaskRead,
    TaskStatus,
    TaskUpdate,
)
from src.modules.users.models import User

router = APIRouter(tags=["tasks"])


@router.get("/projects/{project_id}/tasks", response_model=list[TaskRead])
async def list_tasks(
    project_id: UUID,
    task_status: TaskStatus | None = Query(default=None, alias="status"),
    assignee_id: UUID | None = None,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Task]:
    await require_project_member(session, project_id, user)
    query = select(Task).where(Task.project_id == project_id)
    if task_status is not None:
        query = query.where(Task.status == task_status)
    if assignee_id is not None:
        query = query.where(Task.assignee_id == assignee_id)
    result = await session.scalars(
        query.order_by(Task.created_at.desc()).offset(offset).limit(limit)
    )
    return list(result)


@router.post(
    "/projects/{project_id}/tasks",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    project_id: UUID,
    body: TaskCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Task:
    await require_project_member(session, project_id, user)
    if body.assignee_id is not None:
        await require_project_user(session, project_id, body.assignee_id)
    task = Task(
        project_id=project_id,
        created_by=user.id,
        title=body.title.strip(),
        description=body.description,
        status=body.status,
        due_at=body.due_at,
        assignee_id=body.assignee_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def get_task(session: AsyncSession, project_id: UUID, task_id: UUID) -> Task:
    task = await session.scalar(
        select(Task).where(Task.id == task_id, Task.project_id == project_id)
    )
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy công việc")
    return task


@router.get("/projects/{project_id}/tasks/{task_id}", response_model=TaskRead)
async def read_task(
    project_id: UUID,
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Task:
    await require_project_member(session, project_id, user)
    return await get_task(session, project_id, task_id)


@router.patch("/projects/{project_id}/tasks/{task_id}", response_model=TaskRead)
async def update_task(
    project_id: UUID,
    task_id: UUID,
    body: TaskUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Task:
    await require_project_member(session, project_id, user)
    task = await get_task(session, project_id, task_id)
    changes = body.model_dump(exclude_unset=True)
    if "title" in changes:
        if changes["title"] is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY, "Tiêu đề không được là null"
            )
        changes["title"] = changes["title"].strip()
    if "status" in changes and changes["status"] is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Trạng thái không được là null"
        )
    if changes.get("assignee_id") is not None:
        await require_project_user(session, project_id, changes["assignee_id"])
    for key, value in changes.items():
        setattr(task, key, value)
    await session.commit()
    await session.refresh(task)
    return task


@router.delete(
    "/projects/{project_id}/tasks/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_task(
    project_id: UUID,
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    await require_project_member(session, project_id, user)
    task = await get_task(session, project_id, task_id)
    await session.delete(task)
    await session.commit()


async def require_task_member(
    session: AsyncSession, project_id: UUID, task_id: UUID, user: User
) -> Task:
    await require_project_member(session, project_id, user)
    return await get_task(session, project_id, task_id)


@router.get(
    "/projects/{project_id}/tasks/{task_id}/comments",
    response_model=list[CommentRead],
)
async def list_comments(
    project_id: UUID,
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Comment]:
    await require_task_member(session, project_id, task_id, user)
    result = await session.scalars(
        select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)
    )
    return list(result)


@router.post(
    "/projects/{project_id}/tasks/{task_id}/comments",
    response_model=CommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    project_id: UUID,
    task_id: UUID,
    body: CommentCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Comment:
    await require_task_member(session, project_id, task_id, user)
    comment = Comment(task_id=task_id, author_id=user.id, body=body.body.strip())
    session.add(comment)
    await session.commit()
    await session.refresh(comment)
    return comment


@router.delete(
    "/projects/{project_id}/tasks/{task_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_comment(
    project_id: UUID,
    task_id: UUID,
    comment_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    await require_task_member(session, project_id, task_id, user)
    comment = await session.scalar(
        select(Comment).where(Comment.id == comment_id, Comment.task_id == task_id)
    )
    if comment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy bình luận")
    if comment.author_id != user.id and user.role != "admin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Chỉ tác giả hoặc quản trị viên mới được xóa bình luận",
        )
    await session.delete(comment)
    await session.commit()
