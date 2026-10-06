import type { TaskPriority, TaskStatus, UUID } from "@/api";

export const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Cần làm" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "done", label: "Hoàn thành" },
];

export const priorities: { value: TaskPriority; label: string }[] = [
  { value: "none", label: "Không" },
  { value: "low", label: "Thấp" },
  { value: "medium", label: "Trung bình" },
  { value: "high", label: "Cao" },
  { value: "highest", label: "Khẩn cấp" },
];

export const taskQueryKey = (projectId: UUID) => ["project-tasks", projectId];
export const memberQueryKey = (projectId: UUID) => [
  "project-members",
  projectId,
];
