from pathlib import Path
from urllib.parse import quote
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.infra.security import hash_password
from src.infra.settings import settings
from src.modules.auth.dependencies import get_current_user
from src.modules.users.models import User
from src.modules.users.schema import UserCreate, UserRead

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
    if current_user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    result = await session.scalars(select(User).order_by(User.email))
    return list(result)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")

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
    await session.commit()
    await session.refresh(user)
    return user


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
