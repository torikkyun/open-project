from datetime import datetime
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.infra.uploads import delete_upload, save_upload, upload_path
from src.modules.auth.dependencies import get_current_user
from src.modules.projects.models import Project
from src.modules.projects.service import require_project_member, require_project_user
from src.modules.tasks.models import Comment, Task, TaskAttachment
from src.modules.tasks.schema import (
    AttachmentRead,
    CommentCreate,
    CommentRead,
    TaskCreate,
    TaskRead,
    TaskReorder,
    TaskStatus,
    TaskUpdate,
)
from src.modules.users.models import User

router = APIRouter(tags=["tasks"])

ATTACHMENT_SUBDIR = "attachments"
MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
ATTACHMENT_TYPES = {
    "application/pdf": ".pdf",
    "application/zip": ".zip",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
}


def ensure_due_within_parent(
    parent_due_at: datetime | None, due_at: datetime | None
) -> None:
    """Công việc con không được có hạn chót vượt quá công việc cha."""
    if parent_due_at is None or due_at is None:
        return
    if due_at > parent_due_at:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Hạn chót của công việc con không được vượt quá công việc cha",
        )


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
        query.order_by(Task.parent_task_id, Task.position, Task.created_at)
        .offset(offset)
        .limit(limit)
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
    if body.parent_task_id is not None:
        parent_task = await session.scalar(
            select(Task).where(
                Task.id == body.parent_task_id,
                Task.project_id == project_id,
            )
        )
        if parent_task is None:
            raise HTTPException(
                status.HTTP_404_NOT_FOUND, "Không tìm thấy công việc cha"
            )
        if parent_task.parent_task_id is not None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "Subtask không thể có subtask con",
            )
        ensure_due_within_parent(parent_task.due_at, body.due_at)
    if body.assignee_id is not None:
        await require_project_user(session, project_id, body.assignee_id)
    reporter_id = body.reporter_id or user.id
    await require_project_user(session, project_id, reporter_id)
    project = await session.scalar(
        select(Project).where(Project.id == project_id).with_for_update()
    )
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dự án không tồn tại")
    project.next_task_number += 1
    await session.flush()
    task = Task(
        project_id=project_id,
        parent_task_id=body.parent_task_id,
        task_number=project.next_task_number,
        position=float(project.next_task_number),
        created_by=user.id,
        reporter_id=reporter_id,
        title=body.title.strip(),
        description=body.description,
        status=body.status,
        priority=body.priority,
        start_at=body.start_at,
        due_at=body.due_at,
        assignee_id=body.assignee_id,
    )
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


@router.post(
    "/projects/{project_id}/tasks/reorder",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def reorder_tasks(
    project_id: UUID,
    body: TaskReorder,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    await require_project_member(session, project_id, user)
    if body.parent_task_id is not None:
        await get_task(session, project_id, body.parent_task_id)
    siblings = list(
        await session.scalars(
            select(Task).where(
                Task.project_id == project_id,
                Task.parent_task_id == body.parent_task_id,
            )
        )
    )
    if {task.id for task in siblings} != set(body.task_ids):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Danh sách phải chứa toàn bộ công việc cùng cấp của dự án",
        )
    siblings_by_id = {task.id: task for task in siblings}
    for position, task_id in enumerate(body.task_ids):
        siblings_by_id[task_id].position = float(position)
    await session.commit()


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
    if "priority" in changes and changes["priority"] is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Mức độ ưu tiên không được là null"
        )
    if "reporter_id" in changes and changes["reporter_id"] is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY, "Người báo cáo không được là null"
        )
    if "due_at" in changes:
        if task.parent_task_id is not None:
            parent_task = await session.scalar(
                select(Task).where(Task.id == task.parent_task_id)
            )
            ensure_due_within_parent(
                parent_task.due_at if parent_task else None, changes["due_at"]
            )
        children = await session.scalars(
            select(Task).where(Task.parent_task_id == task.id)
        )
        for child in children:
            if (
                changes["due_at"] is not None
                and child.due_at is not None
                and child.due_at > changes["due_at"]
            ):
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "Hạn chót công việc cha không được nhỏ hơn hạn chót công việc con",
                )
    if changes.get("assignee_id") is not None:
        await require_project_user(session, project_id, changes["assignee_id"])
    if changes.get("reporter_id") is not None:
        await require_project_user(session, project_id, changes["reporter_id"])
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
    await delete_task_attachments(session, task_id)
    await session.delete(task)
    await session.commit()


async def delete_task_attachments(session: AsyncSession, task_id: UUID) -> None:
    """Xóa tệp trên đĩa trước khi hàng bị xóa theo khóa ngoại."""
    paths = await session.scalars(
        select(TaskAttachment.storage_path).where(TaskAttachment.task_id == task_id)
    )
    for path in paths:
        delete_upload(path, ATTACHMENT_SUBDIR)


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
    await delete_comment_attachments(session, comment_id)
    await session.delete(comment)
    await session.commit()


async def delete_comment_attachments(session: AsyncSession, comment_id: UUID) -> None:
    paths = await session.scalars(
        select(TaskAttachment.storage_path).where(
            TaskAttachment.comment_id == comment_id
        )
    )
    for path in paths:
        delete_upload(path, ATTACHMENT_SUBDIR)


async def get_attachment(
    session: AsyncSession, task_id: UUID, attachment_id: UUID
) -> TaskAttachment:
    attachment = await session.scalar(
        select(TaskAttachment).where(
            TaskAttachment.id == attachment_id,
            TaskAttachment.task_id == task_id,
        )
    )
    if attachment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy tệp đính kèm")
    return attachment


@router.get(
    "/projects/{project_id}/tasks/{task_id}/attachments",
    response_model=list[AttachmentRead],
)
async def list_attachments(
    project_id: UUID,
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[TaskAttachment]:
    await require_task_member(session, project_id, task_id, user)
    result = await session.scalars(
        select(TaskAttachment)
        .where(TaskAttachment.task_id == task_id)
        .order_by(TaskAttachment.created_at)
    )
    return list(result)


@router.post(
    "/projects/{project_id}/tasks/{task_id}/attachments",
    response_model=AttachmentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_attachment(
    project_id: UUID,
    task_id: UUID,
    file: UploadFile = File(...),
    comment_id: UUID | None = Form(None),
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> TaskAttachment:
    await require_task_member(session, project_id, task_id, user)
    if comment_id is not None:
        comment = await session.scalar(
            select(Comment).where(Comment.id == comment_id, Comment.task_id == task_id)
        )
        if comment is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy bình luận")
    storage_path, size_bytes, original_name = await save_upload(
        file,
        ATTACHMENT_SUBDIR,
        ATTACHMENT_TYPES,
        MAX_ATTACHMENT_SIZE,
        type_error="Chỉ chấp nhận tệp PDF, ZIP, ảnh, Word hoặc Excel",
        size_error="Tệp đính kèm không được vượt quá 10 MB",
    )
    attachment = TaskAttachment(
        task_id=task_id,
        comment_id=comment_id,
        uploader_id=user.id,
        original_name=original_name,
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        storage_path=storage_path,
    )
    session.add(attachment)
    await session.commit()
    await session.refresh(attachment)
    return attachment


@router.get(
    "/projects/{project_id}/tasks/{task_id}/attachments/{attachment_id}/download"
)
async def download_attachment(
    project_id: UUID,
    task_id: UUID,
    attachment_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> FileResponse:
    await require_task_member(session, project_id, task_id, user)
    attachment = await get_attachment(session, task_id, attachment_id)
    path = upload_path(attachment.storage_path, ATTACHMENT_SUBDIR)
    if path is None or not path.is_file():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Tệp không còn tồn tại")
    return FileResponse(
        path, filename=attachment.original_name, media_type=attachment.content_type
    )


@router.delete(
    "/projects/{project_id}/tasks/{task_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_attachment(
    project_id: UUID,
    task_id: UUID,
    attachment_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    await require_task_member(session, project_id, task_id, user)
    attachment = await get_attachment(session, task_id, attachment_id)
    if attachment.uploader_id != user.id and user.role != "admin":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Chỉ người tải lên hoặc quản trị viên mới được xóa tệp đính kèm",
        )
    storage_path = attachment.storage_path
    await session.delete(attachment)
    await session.commit()
    delete_upload(storage_path, ATTACHMENT_SUBDIR)
