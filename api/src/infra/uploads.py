"""Lưu và xóa tệp tải lên trong thư mục media."""

from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status

from src.infra.settings import settings


def upload_directory(subdir: str) -> Path:
    directory = Path(settings.upload_dir or "media") / subdir
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def upload_path(url: str, subdir: str) -> Path | None:
    """Đổi đường dẫn media thành đường dẫn trên đĩa, chặn thoát khỏi thư mục."""
    prefix = f"/media/{subdir}/"
    if not url.startswith(prefix):
        return None
    path = upload_directory(subdir) / url.removeprefix(prefix)
    return path if path.parent == upload_directory(subdir) else None


def delete_upload(url: str | None, subdir: str) -> None:
    if not url:
        return
    path = upload_path(url, subdir)
    if path is not None:
        path.unlink(missing_ok=True)


async def save_upload(
    file: UploadFile,
    subdir: str,
    types: dict[str, str],
    max_size: int,
    *,
    type_error: str,
    size_error: str,
) -> tuple[str, int, str]:
    """Lưu tệp tải lên, trả về (đường dẫn media, dung lượng, tên gốc)."""
    extension = types.get(file.content_type or "")
    if extension is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, type_error)

    contents = await file.read(max_size + 1)
    if len(contents) > max_size:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, size_error)

    filename = f"{uuid4().hex}{extension}"
    (upload_directory(subdir) / filename).write_bytes(contents)
    original_name = Path(file.filename or "").name.strip() or "tệp đính kèm"
    return f"/media/{subdir}/{filename}", len(contents), original_name[:255]
