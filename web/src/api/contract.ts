export type UUID = string

export type TaskStatus = "todo" | "in_progress" | "done"

export interface User {
  id: UUID
  email: string
  full_name: string
  role: "admin" | "employee"
  is_active: boolean
  created_at: string
}

export interface UserCreate {
  email: string
  full_name: string
  password: string
}

export interface Project {
  id: UUID
  name: string
  description: string | null
  owner_id: UUID
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  description: string | null
}

export interface ProjectUpdate {
  name?: string
  description?: string | null
}

export interface Task {
  id: UUID
  project_id: UUID
  title: string
  description: string | null
  status: TaskStatus
  due_at: string | null
  assignee_id: UUID | null
  created_by: UUID
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description: string | null
  status: TaskStatus
  due_at: string | null
  assignee_id: UUID | null
}

export type TaskUpdate = Partial<TaskCreate>

export interface Comment {
  id: UUID
  task_id: UUID
  author_id: UUID
  body: string
  created_at: string
}

export interface CommentCreate {
  body: string
}