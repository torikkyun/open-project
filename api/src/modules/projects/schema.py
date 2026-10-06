from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    project_key: str = Field(min_length=2, max_length=10, pattern=r"^[A-Za-z][A-Za-z0-9]*$")
    description: str | None = None

    @field_validator("project_key")
    @classmethod
    def normalize_project_key(cls, value: str) -> str:
        return value.upper()

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Tên dự án không được để trống")
        return value


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Tên dự án không được để trống")
        return value


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    project_key: str
    description: str | None
    owner_id: UUID
    created_at: datetime
    updated_at: datetime


class MemberCreate(BaseModel):
    user_id: UUID
