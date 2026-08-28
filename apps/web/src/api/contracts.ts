import type { ApiEnvelope, ApiMeta } from "./client";

export type UserRole = "admin" | "project_manager" | "member" | "guest";

export type ProjectPermission = {
  project_id: string;
  can_view: boolean;
  can_comment: boolean;
  can_upload: boolean;
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
  priority?: TaskPriority;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  start_date: string;
  end_date: string;
  assignee_ids?: string[];
  parent_task_id?: string | null;
  is_milestone?: boolean;
  custom_fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
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
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata?: Record<string, unknown>;
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
  total_projects?: number;
  total_tasks?: number;
  completed_tasks?: number;
  overdue_tasks?: number;
  active_members?: number;
  progress?: number;
  [key: string]: unknown;
};

export type ApiListResponse<T> = ApiEnvelope<T[]> & {
  meta?: ApiMeta;
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
