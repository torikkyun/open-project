from datetime import UTC, datetime, timedelta

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.infra.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_refresh_token,
    verify_password,
)
from src.infra.settings import settings
from src.modules.auth.models import RefreshSession
from src.modules.auth.schema import LoginRequest
from src.modules.users.models import User

router = APIRouter(prefix="/auth", tags=["auth"])


ACCESS_COOKIE = "open-project-access"
REFRESH_COOKIE = "open-project-refresh"


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    common = {
        "httponly": True,
        "secure": settings.cookie_secure,
        "samesite": settings.cookie_samesite,
    }
    response.set_cookie(
        ACCESS_COOKIE,
        access_token,
        max_age=settings.auth_token_expire_minutes * 60,
        **common,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        max_age=settings.auth_refresh_token_expire_days * 86400,
        path="/api/v1/auth",
        **common,
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")


@router.post("/login", status_code=status.HTTP_204_NO_CONTENT)
async def login(
    body: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> None:
    user = await session.scalar(
        select(User).where(func.lower(User.email) == str(body.email).lower())
    )
    if (
        user is None
        or not user.is_active
        or not verify_password(body.password, user.password_hash)
    ):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Email hoặc mật khẩu không hợp lệ",
            headers={"WWW-Authenticate": "Bearer"},
        )
    refresh_token = create_refresh_token(user.id)
    session.add(
        RefreshSession(
            user_id=user.id,
            token_hash=hash_refresh_token(refresh_token),
            expires_at=datetime.now(UTC)
            + timedelta(days=settings.auth_refresh_token_expire_days),
        )
    )
    await session.commit()
    set_auth_cookies(response, create_access_token(user.id), refresh_token)


@router.post("/refresh", status_code=status.HTTP_204_NO_CONTENT)
async def refresh(
    response: Response,
    refresh_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
    session: AsyncSession = Depends(get_session),
) -> None:
    unauthorized = HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token không hợp lệ")
    if refresh_cookie is None:
        raise unauthorized
    try:
        user_id = decode_refresh_token(refresh_cookie)
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise unauthorized from None

    refresh_session = await session.scalar(
        select(RefreshSession).where(
            RefreshSession.token_hash == hash_refresh_token(refresh_cookie),
            RefreshSession.user_id == user_id,
        )
    )
    if refresh_session is None:
        raise unauthorized
    if (
        refresh_session.revoked_at is not None
        or refresh_session.expires_at <= datetime.now(UTC)
    ):
        sessions = await session.scalars(
            select(RefreshSession).where(
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
            )
        )
        for active_session in sessions:
            active_session.revoked_at = datetime.now(UTC)
        await session.commit()
        raise unauthorized
    refresh_session.revoked_at = datetime.now(UTC)
    new_refresh_token = create_refresh_token(user_id)
    session.add(
        RefreshSession(
            user_id=user_id,
            token_hash=hash_refresh_token(new_refresh_token),
            expires_at=datetime.now(UTC)
            + timedelta(days=settings.auth_refresh_token_expire_days),
        )
    )
    await session.commit()
    set_auth_cookies(response, create_access_token(user_id), new_refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    refresh_cookie: str | None = Cookie(None, alias=REFRESH_COOKIE),
    session: AsyncSession = Depends(get_session),
) -> None:
    if refresh_cookie is not None:
        refresh_session = await session.scalar(
            select(RefreshSession).where(
                RefreshSession.token_hash == hash_refresh_token(refresh_cookie)
            )
        )
        if refresh_session is not None and refresh_session.revoked_at is None:
            refresh_session.revoked_at = datetime.now(UTC)
            await session.commit()
    clear_auth_cookies(response)
