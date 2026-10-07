from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["none", "low", "medium", "high", "highest"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus = "todo"
    priority: TaskPriority = "none"
    start_at: datetime | None = None
    due_at: datetime | None = None
    assignee_id: UUID | None = None
    reporter_id: UUID | None = None
    parent_task_id: UUID | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Tiêu đề công việc không được để trống")
        return value


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    start_at: datetime | None = None
    due_at: datetime | None = None
    assignee_id: UUID | None = None
    reporter_id: UUID | None = None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Tiêu đề công việc không được để trống")
        return value


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    parent_task_id: UUID | None
    task_number: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    start_at: datetime | None
    due_at: datetime | None
    assignee_id: UUID | None
    reporter_id: UUID
    position: float
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class TaskReorder(BaseModel):
    parent_task_id: UUID | None = None
    task_ids: list[UUID] = Field(min_length=1)

    @field_validator("task_ids")
    @classmethod
    def unique_task_ids(cls, value: list[UUID]) -> list[UUID]:
        if len(value) != len(set(value)):
            raise ValueError("Danh sách công việc có mã trùng lặp")
        return value


class CommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=10_000)

    @field_validator("body")
    @classmethod
    def normalize_body(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Bình luận không được để trống")
        return value


class AttachmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    comment_id: UUID | None
    uploader_id: UUID
    original_name: str
    content_type: str
    size_bytes: int
    created_at: datetime


class CommentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    author_id: UUID
    body: str
    created_at: datetime
