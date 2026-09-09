import { api } from "../client";
import type {
  ApiSingleResponse,
  PaginationParams,
  Project,
} from "../contracts";

export const projectQueryKeys = {
  list: ["projects", "list"],
  detail: (id: string) => ["projects", id],
} as const;

export type AddProjectMemberInput = {
  user_id: string;
  role?: string;
  can_view?: boolean;
  can_comment?: boolean;
  can_upload?: boolean;
};

export type CreateProjectInput = Partial<Project> & {
  name: string;
  start_date: string;
  end_date: string;
  template_id?: string;
  member_ids?: string[];
};

export const projectsEndpoints = {
  list: (params: PaginationParams = {}) =>
    api.get<Project[]>("/v1/projects", { params }),
  getById: (id: string) => api.get<Project>(`/v1/projects/${id}`),
  create: (payload: CreateProjectInput) =>
    api.post<Project>("/v1/projects", payload),
  update: (id: string, payload: Partial<Project>) =>
    api.put<Project>(`/v1/projects/${id}`, payload),
  archive: (id: string) =>
    api.post<ApiSingleResponse<Project>>(`/v1/projects/${id}/archive`, {}),
  remove: (id: string) => api.delete<unknown>(`/v1/projects/${id}`),
  addMember: (id: string, payload: AddProjectMemberInput) =>
    api.post<Project>(`/v1/projects/${id}/members`, payload),
  removeMember: (id: string, userId: string) =>
    api.delete<unknown>(`/v1/projects/${id}/members/${userId}`),
};

export type ProjectEndpointGroup = typeof projectsEndpoints;

export default projectsEndpoints;
