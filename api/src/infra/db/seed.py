import asyncio
import logging
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from src.infra.security import hash_password
from src.infra.settings import settings
from src.modules.users.models import User
from src.modules.users.router import default_avatar_url
from src.modules.users.schema import UserCreate

logger = logging.getLogger("seed")

ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "admin@gmail.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "String@123")


async def create_admin(email: str, full_name: str, password: str) -> None:
    admin_input = UserCreate(email=email, full_name=full_name)
    engine = create_async_engine(settings.database_url, pool_pre_ping=True)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with session_factory() as session:
            admin = await session.scalar(
                select(User.id).where(User.role == "admin").limit(1)
            )
            if admin is not None:
                logger.info("Bỏ qua admin %s: đã tồn tại", email)
                return
            existing = await session.scalar(
                select(User.id).where(User.email == admin_input.email)
            )
            if existing is not None:
                logger.info("Bỏ qua admin %s: email đã tồn tại", email)
                return
            session.add(
                User(
                    email=admin_input.email,
                    full_name=admin_input.full_name,
                    password_hash=hash_password(password),
                    avatar_url=default_avatar_url(admin_input.email),
                    role="admin",
                )
            )
            await session.commit()
            logger.info("Đã tạo admin %s", email)
    finally:
        await engine.dispose()


async def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    email = ADMIN_EMAIL
    full_name = "admin"
    password = ADMIN_PASSWORD
    await create_admin(email, full_name, password)


if __name__ == "__main__":
    asyncio.run(main())
