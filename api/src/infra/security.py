import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from pwdlib import PasswordHash

from src.infra.settings import settings

password_hash = PasswordHash.recommended()


def generate_reset_token() -> str:
    """Sinh token đặt lại mật khẩu ngẫu nhiên (256 bit)."""
    return secrets.token_urlsafe(32)


def hash_reset_token(token: str) -> str:
    """Băm token để lưu DB; token đã đủ entropy nên SHA-256 là đủ."""
    return hashlib.sha256(token.encode()).hexdigest()


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def generate_device_token() -> str:
    """Sinh token thiết bị tin cậy ngẫu nhiên (256 bit)."""
    return secrets.token_urlsafe(32)


def hash_device_token(token: str) -> str:
    """Băm token thiết bị để lưu DB; token đã đủ entropy nên SHA-256 là đủ."""
    return hashlib.sha256(token.encode()).hexdigest()


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(subject: UUID) -> str:
    if len(settings.auth_secret_key) < 32:
        raise RuntimeError("AUTH_SECRET_KEY must contain at least 32 characters")
    expires_at = datetime.now(UTC) + timedelta(
        minutes=settings.auth_token_expire_minutes
    )
    payload = {"sub": str(subject), "type": "access", "exp": expires_at}
    return jwt.encode(payload, settings.auth_secret_key, algorithm="HS256")


def create_refresh_token(subject: UUID) -> str:
    if len(settings.auth_secret_key) < 32:
        raise RuntimeError("AUTH_SECRET_KEY must contain at least 32 characters")
    expires_at = datetime.now(UTC) + timedelta(
        days=settings.auth_refresh_token_expire_days
    )
    payload = {"sub": str(subject), "type": "refresh", "exp": expires_at}
    return jwt.encode(payload, settings.auth_secret_key, algorithm="HS256")


def decode_access_token(token: str) -> UUID:
    if len(settings.auth_secret_key) < 32:
        raise RuntimeError("AUTH_SECRET_KEY must contain at least 32 characters")
    payload = jwt.decode(token, settings.auth_secret_key, algorithms=["HS256"])
    if payload.get("type") != "access":
        raise TypeError("Invalid token type")
    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise TypeError("Invalid token subject")
    return UUID(subject)


def decode_refresh_token(token: str) -> UUID:
    if len(settings.auth_secret_key) < 32:
        raise RuntimeError("AUTH_SECRET_KEY must contain at least 32 characters")
    payload = jwt.decode(token, settings.auth_secret_key, algorithms=["HS256"])
    if payload.get("type") != "refresh":
        raise TypeError("Invalid token type")
    subject = payload.get("sub")
    if not isinstance(subject, str):
        raise TypeError("Invalid token subject")
    return UUID(subject)
