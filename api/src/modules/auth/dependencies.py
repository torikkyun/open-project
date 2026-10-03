from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyCookie
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infra.db.session import get_session
from src.infra.security import decode_access_token
from src.modules.auth.router import ACCESS_COOKIE
from src.modules.users.models import User

access_cookie_scheme = APIKeyCookie(name=ACCESS_COOKIE, auto_error=False)


async def get_current_user(
    access_cookie: Annotated[str | None, Depends(access_cookie_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    unauthorized = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Token không hợp lệ hoặc bị thiếu",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if access_cookie is None:
        raise unauthorized

    try:
        user_id = decode_access_token(access_cookie)
    except (jwt.InvalidTokenError, TypeError, ValueError):
        raise unauthorized from None

    user = await session.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise unauthorized
    return user
