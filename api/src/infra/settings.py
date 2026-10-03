from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = ""
    auth_secret_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000"]
    auth_token_expire_minutes: int = 60
    auth_refresh_token_expire_days: int = 30
    cookie_secure: bool = False
    cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    redis_url: str = ""
    cache_ttl: int = 60
    password_reset_expire_minutes: int = 15
    email_verification_otp_expires_minutes: int = 10
    email_verification_resend_cooldown_seconds: int = 60
    # Số ngày bỏ qua OTP trên thiết bị đã xác thực. 0 = luôn yêu cầu OTP.
    login_otp_trust_days: int = 1
    upload_dir: str = ""

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 465
    smtp_secure: bool = True
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    email_app_name: str = ""
    site_url: str = ""
    support_email: str = ""
    notify_email_encryption_key: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def reset_password_url(self) -> str:
        """Trang đặt lại mật khẩu ở frontend, dùng cho link trong email."""
        base = self.site_url.rstrip("/")
        if not base.startswith(("http://", "https://")):
            base = f"https://{base}"
        return f"{base}/reset"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = Settings()
