from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.modules.auth.dependencies import get_current_user
from src.modules.projects.models import Project, ProjectMember
from src.modules.projects.schema import (
    MemberCreate,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from src.modules.projects.service import (
    require_project_member,
    require_project_owner,
)
from src.modules.tasks.models import Task
from src.modules.users.models import User
from src.modules.users.schema import UserRead

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Project]:
    result = await session.scalars(
        select(Project)
        .join(ProjectMember, ProjectMember.project_id == Project.id)
        .where(ProjectMember.user_id == user.id)
        .order_by(Project.created_at.desc())
    )
    return list(result)


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Project:
    project_key = body.project_key.upper()
    if await session.scalar(
        select(Project.id).where(Project.project_key == project_key)
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "Mã dự án đã được sử dụng")
    project = Project(
        name=body.name.strip(),
        project_key=project_key,
        description=body.description,
        owner_id=user.id,
    )
    session.add(project)
    await session.flush()
    session.add(ProjectMember(project_id=project.id, user_id=user.id))
    await session.commit()
    await session.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
async def read_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Project:
    return await require_project_member(session, project_id, user)


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Project:
    project = await require_project_member(session, project_id, user)
    changes = body.model_dump(exclude_unset=True)
    if "name" in changes and changes["name"] is None:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name cannot be null")
    if "name" in changes:
        changes["name"] = changes["name"].strip()
    for key, value in changes.items():
        setattr(project, key, value)
    await session.commit()
    await session.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    project = await require_project_owner(session, project_id, user)
    await session.delete(project)
    await session.commit()


@router.get("/{project_id}/members", response_model=list[UserRead])
async def list_project_members(
    project_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[User]:
    await require_project_member(session, project_id, user)
    result = await session.scalars(
        select(User)
        .join(ProjectMember, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
        .order_by(User.email)
    )
    return list(result)


@router.post("/{project_id}/members", status_code=status.HTTP_204_NO_CONTENT)
async def add_project_member(
    project_id: UUID,
    body: MemberCreate,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    await require_project_owner(session, project_id, user)
    member = await session.scalar(select(User).where(User.id == body.user_id))
    if member is None or not member.is_active:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    existing = await session.scalar(
        select(ProjectMember.id).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == body.user_id,
        )
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "User is already a member")
    session.add(ProjectMember(project_id=project_id, user_id=body.user_id))
    await session.commit()


@router.delete(
    "/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> None:
    project = await require_project_owner(session, project_id, user)
    if project.owner_id == user_id:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Cannot remove owner")
    result = await session.execute(
        delete(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    if not result.rowcount:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project member not found")
    await session.execute(
        update(Task)
        .where(Task.project_id == project_id, Task.assignee_id == user_id)
        .values(assignee_id=None)
    )
    await session.commit()
