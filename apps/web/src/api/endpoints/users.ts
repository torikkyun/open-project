import { api } from "../client";
import type { PaginationParams, User } from "../contracts";

export const userQueryKeys = {
  list: ["users", "list"],
  detail: (id: string) => ["users", id],
} as const;

export const usersEndpoints = {
  list: (params: PaginationParams = {}) =>
    api.get<User[]>("/v1/users", { params }),
  getById: (id: string) => api.get<User>(`/v1/users/${id}`),
  create: (
    payload: Partial<User> & {
      name: string;
      email: string;
      role: User["role"];
    },
  ) => api.post<User>("/v1/users", payload),
  update: (id: string, payload: Partial<User>) =>
    api.put<User>(`/v1/users/${id}`, payload),
  remove: (id: string) => api.delete<unknown>(`/v1/users/${id}`),
};

export type UserEndpointGroup = typeof usersEndpoints;

export default usersEndpoints;
