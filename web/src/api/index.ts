import type {
  Comment,
  CommentCreate,
  Project,
  ProjectCreate,
  ProjectUpdate,
  Task,
  TaskCreate,
  TaskReorder,
  TaskStatus,
  TaskUpdate,
  User,
  UserCreate,
  UUID,
} from "./contract";
import { request } from "./client";

const jsonBody = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

const listTasks = (
  projectId: UUID,
  options: {
    status?: TaskStatus;
    assigneeId?: UUID;
    offset?: number;
    limit?: number;
  } = {},
) => {
  const query = new URLSearchParams({
    offset: String(options.offset ?? 0),
    limit: String(options.limit ?? 100),
  });
  if (options.status) query.set("status", options.status);
  if (options.assigneeId) query.set("assignee_id", options.assigneeId);
  return request<Task[]>(
    `/projects/${encodeURIComponent(projectId)}/tasks?${query.toString()}`,
  );
};

const listAllTasks = async (projectId: UUID): Promise<Task[]> => {
  const tasks: Task[] = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const page = await listTasks(projectId, { offset, limit });
    tasks.push(...page);
    if (page.length < limit) return tasks;
  }
};

export const api = {
  login: (email: string, password: string) =>
    request<void>("/auth/login", jsonBody("POST", { email, password }), false),
  refresh: () => request<void>("/auth/refresh", { method: "POST" }, false),
  logout: () => request<void>("/auth/logout", { method: "POST" }, false),
  currentUser: () => request<User>("/users/me"),
  updateProfile: (fullName?: string, file?: File) => {
    const body = new FormData();
    if (fullName !== undefined) body.append("full_name", fullName);
    if (file) body.append("avatar", file);
    return request<User>("/users/me", { method: "PATCH", body });
  },
  updateAvatar: (file: File) => api.updateProfile(undefined, file),
  listUsers: () => request<User[]>("/users"),
  createUser: (body: UserCreate) =>
    request<User>("/users", jsonBody("POST", body)),
  updateUser: (userId: UUID, body: UserUpdate) =>
    request<User>(
      `/users/admin/${encodeURIComponent(userId)}`,
      jsonBody("PATCH", body),
    ),
  deleteUser: (userId: UUID) =>
    request<void>(`/users/admin/${encodeURIComponent(userId)}`, {
      method: "DELETE",
    }),

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

  listTasks,
  listAllTasks,
  reorderTasks: (projectId: UUID, body: TaskReorder) =>
    request<void>(
      `/projects/${encodeURIComponent(projectId)}/tasks/reorder`,
      jsonBody("POST", body),
    ),
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
};

export type * from "./contract";
export { ApiError } from "./client";
export { assetUrl } from "./client";
