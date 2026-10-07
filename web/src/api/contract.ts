export type UUID = string;

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "none" | "low" | "medium" | "high" | "highest";

export interface User {
  id: UUID;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: "admin" | "employee";
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: User["role"];
  is_active?: boolean;
}

export interface Project {
  id: UUID;
  name: string;
  project_key: string;
  description: string | null;
  owner_id: UUID;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  project_key: string;
  description: string | null;
}

export interface ProjectUpdate {
  name?: string;
  project_key?: string;
  description?: string | null;
}

export interface Task {
  id: UUID;
  project_id: UUID;
  parent_task_id: UUID | null;
  task_number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_at: string | null;
  due_at: string | null;
  assignee_id: UUID | null;
  reporter_id: UUID;
  position: number;
  created_by: UUID;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_at: string | null;
  due_at: string | null;
  assignee_id: UUID | null;
  reporter_id?: UUID | null;
  parent_task_id?: UUID | null;
}

export type TaskUpdate = Partial<Omit<TaskCreate, "parent_task_id">>;

export interface TaskReorder {
  parent_task_id: UUID | null;
  task_ids: UUID[];
}

export interface Comment {
  id: UUID;
  task_id: UUID;
  author_id: UUID;
  body: string;
  created_at: string;
}

export interface CommentCreate {
  body: string;
}
