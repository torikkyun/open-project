import { api } from "../client";
import type { Department, PaginationParams } from "../contracts";

export const departmentsEndpoints = {
  list: (params: PaginationParams = {}) =>
    api.get<Department[]>("/v1/departments", { params }),
  create: (payload: { name: string }) =>
    api.post<Department>("/v1/departments", payload),
  update: (id: string, payload: { name: string }) =>
    api.put<Department>(`/v1/departments/${id}`, payload),
  remove: (id: string) => api.delete<unknown>(`/v1/departments/${id}`),
};
