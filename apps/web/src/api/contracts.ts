import type { ApiEnvelope, ApiMeta } from "./client";

export type UserRole = "admin" | "project_manager" | "member" | "guest";

export type ProjectPermission = {
  project_id: string;
  can_view: boolean;
  can_comment: boolean;
  can_upload: boolean;
};

export type ProjectMember = {
  id: string;
  name: string;
  role: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string | null;
  created_at?: string;
  updated_at?: string;
  project_permissions?: ProjectPermission[];
};

export type Department = {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  status?: string;
  manager_id?: string | null;
  template_id?: string | null;
  created_by?: { id: string; name: string };
  members_count?: number;
  tasks_count?: number;
  members?: ProjectMember[];
  created_at?: string;
  updated_at?: string;
};

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus =
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "canceled";

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  progress_percent?: number;
  priority?: TaskPriority;
  assignees?: { id: string; name: string }[];
  subtasks_count?: number;
  start_date: string;
  end_date: string;
  assignee_ids?: string[];
  parent_task_id?: string | null;
  is_milestone?: boolean;
  dependencies?: { id: string }[];
  custom_fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type TaskHistory = {
  id: string;
  action: string;
  changes: unknown;
  createdAt: string;
  actor?: { id: string; name: string } | null;
};

export type Comment = {
  id: string;
  task_id?: string | null;
  project_id?: string | null;
  user_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  parent_comment_id?: string | null;
  user?: { id: string; name: string };
  attachments?: Attachment[];
};

export type Attachment = {
  id: string;
  filename: string;
  mime_type?: string | null;
  size?: number;
  path?: string;
  task_id?: string | null;
  project_id?: string | null;
  comment_id?: string | null;
  created_at?: string;
  file_name?: string;
  file_size?: number;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  read_at?: string | null;
  created_at?: string;
};

export type Template = {
  id: string;
  name: string;
  description?: string | null;
  tasks?: Task[];
  created_at?: string;
};

export type DashboardSummary = {
  projects: { total: number; by_status: Record<string, number> };
  tasks: {
    total: number;
    by_status: Record<string, number>;
    backlog: number;
    overdue: number;
    needing_review: number;
    assigned_to_me: number;
  };
  progress_percent: number;
  hours: { estimated: number; actual: number };
  sla: { overdue_tasks: number };
  generated_at: string;
};

export type ApiListResponse<T> = ApiEnvelope<T[]> & {
  meta?: ApiMeta;
  unread_count?: number;
};

export type ApiSingleResponse<T> = ApiEnvelope<T>;

export type AuthLoginPayload = {
  email: string;
  password: string;
};

export type AuthRegisterPayload = {
  name: string;
  email: string;
  password: string;
  invite_token?: string;
};

export type AuthLoginResponse = {
  access_token: string;
  refresh_token: string;
  user: User;
};

export type AuthRefreshResponse = {
  access_token: string;
};

export type PaginationParams = {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
};
