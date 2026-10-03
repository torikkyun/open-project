from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.modules.projects.models import Project, ProjectMember
from src.modules.users.models import User


async def require_project_member(
    session: AsyncSession, project_id: UUID, user: User
) -> Project:
    project = await session.scalar(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(Project.id == project_id, ProjectMember.user_id == user.id)
    )
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dự án không tồn tại")
    return project


async def require_project_owner(
    session: AsyncSession, project_id: UUID, user: User
) -> Project:
    project = await require_project_member(session, project_id, user)
    if project.owner_id != user.id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Chỉ chủ sở hữu dự án mới được phép truy cập"
        )
    return project


async def require_project_user(
    session: AsyncSession, project_id: UUID, user_id: UUID
) -> None:
    member_id = await session.scalar(
        select(ProjectMember.id)
        .join(User, User.id == ProjectMember.user_id)
        .where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
            User.is_active.is_(True),
        )
    )
    if member_id is None:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Người dùng được chỉ định phải là thành viên của dự án",
        )
