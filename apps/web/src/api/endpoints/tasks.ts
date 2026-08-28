import { api } from "../client";
import type {
  ApiListResponse,
  ApiSingleResponse,
  PaginationParams,
  Task,
} from "../contracts";

export const taskQueryKeys = {
  list: (projectId: string) => ["tasks", projectId, "list"],
  detail: (id: string) => ["tasks", id],
  history: (id: string) => ["tasks", id, "history"],
  dependencies: (taskId: string) => ["tasks", taskId, "dependencies"],
} as const;

export const tasksEndpoints = {
  list: (projectId: string, params: PaginationParams = {}) =>
    api.get<ApiListResponse<Task>>(`/v1/projects/${projectId}/tasks`, {
      params,
    }),
  getById: (id: string) => api.get<ApiSingleResponse<Task>>(`/v1/tasks/${id}`),
  create: (
    projectId: string,
    payload: Partial<Task> & {
      title: string;
      start_date: string;
      end_date: string;
    },
  ) =>
    api.post<ApiSingleResponse<Task>>(
      `/v1/projects/${projectId}/tasks`,
      payload,
    ),
  update: (id: string, payload: Partial<Task>) =>
    api.put<ApiSingleResponse<Task>>(`/v1/tasks/${id}`, payload),
  updateStatus: (id: string, status: string) =>
    api.patch<ApiSingleResponse<Task>>(`/v1/tasks/${id}/status`, { status }),
  remove: (id: string) => api.delete<unknown>(`/v1/tasks/${id}`),
  getHistory: (id: string) =>
    api.get<ApiSingleResponse<Task[]>>(`/v1/tasks/${id}/history`),
  listDependencies: (taskId: string) =>
    api.get<ApiListResponse<Task>>(`/v1/tasks/${taskId}/dependencies`),
  createDependency: (
    taskId: string,
    payload: { dependency_id: string; type?: string },
  ) =>
    api.post<ApiSingleResponse<Task>>(
      `/v1/tasks/${taskId}/dependencies`,
      payload,
    ),
  removeDependency: (taskId: string, dependencyId: string) =>
    api.delete<unknown>(`/v1/tasks/${taskId}/dependencies/${dependencyId}`),
  approveReview: (id: string, comment?: string) =>
    api.post<ApiSingleResponse<Task>>(`/v1/tasks/${id}/review/approve`, {
      comment,
    }),
  rejectReview: (id: string, comment?: string) =>
    api.post<ApiSingleResponse<Task>>(`/v1/tasks/${id}/review/reject`, {
      comment,
    }),
};

export type TaskEndpointGroup = typeof tasksEndpoints;

export default tasksEndpoints;
