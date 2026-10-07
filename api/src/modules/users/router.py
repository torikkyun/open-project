from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import quote
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import exists, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.infra.security import hash_password
from src.infra.settings import settings
from src.modules.auth.dependencies import get_current_user
from src.modules.auth.models import RefreshSession
from src.modules.projects.models import Project, ProjectMember
from src.modules.tasks.models import Comment, Task
from src.modules.users.models import User
from src.modules.users.schema import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])

MAX_AVATAR_SIZE = 5 * 1024 * 1024
AVATAR_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


def default_avatar_url(email: str) -> str:
    return (
        "https://api.dicebear.com/9.x/initials/svg"
        f"?seed={quote(email)}&backgroundType=gradientLinear"
    )


def avatar_directory() -> Path:
    directory = Path(settings.upload_dir or "media") / "avatars"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")


async def active_admin_count(session: AsyncSession) -> int:
    admins = await session.scalars(
        select(User)
        .where(
            User.role == "admin",
            User.is_active.is_(True),
        )
        .with_for_update()
    )
    return len(admins.all())


async def revoke_user_sessions(session: AsyncSession, user_id: UUID) -> None:
    sessions = await session.scalars(
        select(RefreshSession).where(
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
        )
    )
    now = datetime.now(UTC)
    for refresh_session in sessions:
        refresh_session.revoked_at = now


@router.get("/me", response_model=UserRead)
async def read_current_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


@router.get("", response_model=list[UserRead])
async def list_users(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> list[User]:
    require_admin(current_user)
    result = await session.scalars(select(User).order_by(User.email))
    return list(result)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    require_admin(current_user)

    email = str(body.email).lower()
    exists = await session.scalar(
        select(User.id).where(func.lower(User.email) == email)
    )
    if exists:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already exists")

    user = User(
        email=email,
        full_name=body.full_name.strip(),
        password_hash=hash_password(body.password),
        avatar_url=default_avatar_url(email),
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already exists") from error
    await session.refresh(user)
    return user


@router.patch("/admin/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    require_admin(current_user)
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")

    changes = body.model_dump(exclude_unset=True)
    email = changes.get("email")
    if email is not None:
        existing_id = await session.scalar(
            select(User.id).where(
                func.lower(User.email) == email,
                User.id != user.id,
            )
        )
        if existing_id is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already exists")

    if user.id == current_user.id and changes.get("is_active") is False:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "You cannot deactivate your own account",
        )

    loses_admin_access = user.role == "admin" and user.is_active and (
        changes.get("role", user.role) != "admin"
        or changes.get("is_active", user.is_active) is False
    )
    if loses_admin_access and await active_admin_count(session) <= 1:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "At least one active admin account must remain",
        )

    for field, value in changes.items():
        setattr(user, field, value)
    if changes.get("is_active") is False:
        await revoke_user_sessions(session, user.id)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already exists") from error
    await session.refresh(user)
    return user


@router.delete("/admin/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> None:
    require_admin(current_user)
    user = await session.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")
    if user.id == current_user.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "You cannot delete your own account")
    if (
        user.role == "admin"
        and user.is_active
        and await active_admin_count(session) <= 1
    ):
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "At least one active admin account must remain",
        )

    has_references = await session.scalar(
        select(
            exists(select(Project.id).where(Project.owner_id == user.id))
            | exists(
                select(ProjectMember.id).where(ProjectMember.user_id == user.id)
            )
            | exists(
                select(Task.id).where(
                    or_(
                        Task.created_by == user.id,
                        Task.reporter_id == user.id,
                        Task.assignee_id == user.id,
                    )
                )
            )
            | exists(select(Comment.id).where(Comment.author_id == user.id))
        )
    )
    if has_references:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Account has project or task history and cannot be deleted",
        )

    await session.delete(user)
    try:
        await session.commit()
    except IntegrityError as error:
        await session.rollback()
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Account has project or task history and cannot be deleted",
        ) from error


@router.patch("/me", response_model=UserRead)
async def update_current_user_avatar(
    full_name: str | None = Form(None, max_length=160),
    avatar: UploadFile | None = File(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    if full_name is not None:
        full_name = full_name.strip()
        if not full_name:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Họ và tên không được để trống")
        current_user.full_name = full_name

    old_avatar_url = current_user.avatar_url
    if avatar is not None:
        extension = AVATAR_TYPES.get(avatar.content_type or "")
        if extension is None:
            raise HTTPException(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                "Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF",
            )

        contents = await avatar.read(MAX_AVATAR_SIZE + 1)
        if len(contents) > MAX_AVATAR_SIZE:
            raise HTTPException(
                status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                "Ảnh không được vượt quá 5 MB",
            )

        filename = f"{uuid4().hex}{extension}"
        path = avatar_directory() / filename
        path.write_bytes(contents)
        current_user.avatar_url = f"/media/avatars/{filename}"

    await session.commit()
    await session.refresh(current_user)
    if avatar is not None and old_avatar_url and old_avatar_url.startswith("/media/avatars/"):
        old_path = avatar_directory() / old_avatar_url.removeprefix("/media/avatars/")
        if old_path.parent == avatar_directory():
            old_path.unlink(missing_ok=True)
    return current_user
