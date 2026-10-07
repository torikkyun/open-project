"""Nghiệp vụ dùng chung cho phiên đăng nhập và đặt lại mật khẩu."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.security import generate_reset_token, hash_reset_token
from src.infra.settings import settings
from src.modules.auth.models import PasswordResetToken, RefreshSession
from src.modules.users.models import User


async def revoke_user_sessions(session: AsyncSession, user_id: UUID) -> None:
    """Thu hồi mọi phiên refresh đang hoạt động của người dùng."""
    await session.execute(
        update(RefreshSession)
        .where(
            RefreshSession.user_id == user_id,
            RefreshSession.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(UTC))
    )


async def create_reset_token(session: AsyncSession, user: User) -> str:
    """Tạo token đặt lại mật khẩu, chỉ lưu bản băm; trả token gốc cho người gọi."""
    token = generate_reset_token()
    session.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(token),
            expires_at=datetime.now(UTC)
            + timedelta(minutes=settings.password_reset_expire_minutes),
        )
    )
    return token


async def consume_reset_token(session: AsyncSession, token: str) -> User | None:
    """Đổi token còn hạn thành người dùng và đánh dấu đã dùng."""
    reset = await session.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_reset_token(token),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(UTC),
        )
    )
    if reset is None:
        return None
    user = await session.get(User, reset.user_id)
    if user is None:
        return None
    reset.used_at = datetime.now(UTC)
    return user
