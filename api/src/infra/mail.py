"""Gửi email qua SMTP chuẩn; template HTML nằm trong ``src/templates``."""

import asyncio
import smtplib
from email.message import EmailMessage
from pathlib import Path
from string import Template

from src.infra.settings import settings

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates"


class MailNotConfigured(RuntimeError):
    """SMTP chưa được cấu hình nên không thể gửi email."""


def render_template(name: str, **values: object) -> str:
    """Đổ biến dạng ``$ten`` vào template; không cần engine ngoài."""
    source = (TEMPLATE_DIR / f"{name}.html").read_text(encoding="utf-8")
    return Template(source).substitute(
        {key: str(value) for key, value in values.items()}
    )


def reset_password_link(token: str) -> str:
    return f"{settings.reset_password_url}?token={token}"


def _send(to: str, subject: str, text: str, html: str) -> None:
    message = EmailMessage()
    message["From"] = settings.smtp_from or settings.smtp_user
    message["To"] = to
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")
    smtp_class = smtplib.SMTP_SSL if settings.smtp_secure else smtplib.SMTP
    with smtp_class(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_user:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)


async def send_password_reset(email: str, full_name: str, token: str) -> None:
    """Gửi liên kết đặt lại mật khẩu; ném ``MailNotConfigured`` khi thiếu SMTP."""
    if not settings.smtp_host:
        raise MailNotConfigured("SMTP chưa được cấu hình")
    link = reset_password_link(token)
    app_name = settings.email_app_name or "Open Project"
    html = render_template(
        "password_reset",
        app_name=app_name,
        full_name=full_name,
        reset_url=link,
        expires_minutes=settings.password_reset_expire_minutes,
        support_email=settings.support_email or settings.smtp_from,
    )
    await asyncio.to_thread(
        _send,
        email,
        f"Đặt lại mật khẩu {app_name}",
        f"Xin chào {full_name},\n\nMở liên kết sau để đặt lại mật khẩu: {link}\n"
        f"Liên kết hết hạn sau "
        f"{settings.password_reset_expire_minutes} phút.",
        html,
    )
