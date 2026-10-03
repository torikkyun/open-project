import type {
  Comment,
  CommentCreate,
  Project,
  ProjectCreate,
  ProjectUpdate,
  Task,
  TaskCreate,
  TaskStatus,
  TaskUpdate,
  User,
  UserCreate,
  UUID,
} from "./contract"
import { request } from "./client"

const jsonBody = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})

export const api = {
  login: (email: string, password: string) =>
    request<void>(
      "/auth/login",
      jsonBody("POST", { email, password }),
      false,
    ),
  refresh: () => request<void>("/auth/refresh", { method: "POST" }, false),
  logout: () => request<void>("/auth/logout", { method: "POST" }, false),
  currentUser: () => request<User>("/users/me"),
  listUsers: () => request<User[]>("/users"),
  createUser: (body: UserCreate) =>
    request<User>("/users", jsonBody("POST", body)),

  listProjects: () => request<Project[]>("/projects"),
  createProject: (body: ProjectCreate) =>
    request<Project>("/projects", jsonBody("POST", body)),
  updateProject: (projectId: UUID, body: ProjectUpdate) =>
    request<Project>(
      `/projects/${encodeURIComponent(projectId)}`,
      jsonBody("PATCH", body),
    ),
  deleteProject: (projectId: UUID) =>
    request<void>(`/projects/${encodeURIComponent(projectId)}`, {
      method: "DELETE",
    }),
  listMembers: (projectId: UUID) =>
    request<User[]>(`/projects/${encodeURIComponent(projectId)}/members`),
  addMember: (projectId: UUID, userId: UUID) =>
    request<void>(
      `/projects/${encodeURIComponent(projectId)}/members`,
      jsonBody("POST", { user_id: userId }),
    ),
  removeMember: (projectId: UUID, userId: UUID) =>
    request<void>(
      `/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`,
      { method: "DELETE" },
    ),

  listTasks: (projectId: UUID, status?: TaskStatus) => {
    const query = status ? `?status=${encodeURIComponent(status)}` : ""
    return request<Task[]>(
      `/projects/${encodeURIComponent(projectId)}/tasks${query}`,
    )
  },
  createTask: (projectId: UUID, body: TaskCreate) =>
    request<Task>(
      `/projects/${encodeURIComponent(projectId)}/tasks`,
      jsonBody("POST", body),
    ),
  updateTask: (projectId: UUID, taskId: UUID, body: TaskUpdate) =>
    request<Task>(
      `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
      jsonBody("PATCH", body),
    ),
  deleteTask: (projectId: UUID, taskId: UUID) =>
    request<void>(
      `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
      { method: "DELETE" },
    ),
  listComments: (projectId: UUID, taskId: UUID) =>
    request<Comment[]>(
      `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`,
    ),
  createComment: (projectId: UUID, taskId: UUID, body: CommentCreate) =>
    request<Comment>(
      `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments`,
      jsonBody("POST", body),
    ),
  deleteComment: (projectId: UUID, taskId: UUID, commentId: UUID) =>
    request<void>(
      `/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}/comments/${encodeURIComponent(commentId)}`,
      { method: "DELETE" },
    ),
}

export type * from "./contract"
export { ApiError } from "./client"