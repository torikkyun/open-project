import { api } from "../client";
import type {
  ApiListResponse,
  ApiSingleResponse,
  PaginationParams,
  Template,
} from "../contracts";

export const templateQueryKeys = {
  list: ["templates", "list"],
  detail: (id: string) => ["templates", id],
} as const;

export const templatesEndpoints = {
  list: (params: PaginationParams = {}) =>
    api.get<ApiListResponse<Template>>("/v1/templates", { params }),
  getById: (id: string) =>
    api.get<ApiSingleResponse<Template>>(`/v1/templates/${id}`),
  create: (payload: Partial<Template> & { name: string }) =>
    api.post<ApiSingleResponse<Template>>("/v1/templates", payload),
  update: (id: string, payload: Partial<Template>) =>
    api.put<ApiSingleResponse<Template>>(`/v1/templates/${id}`, payload),
  remove: (id: string) => api.delete<unknown>(`/v1/templates/${id}`),
};

export type TemplateEndpointGroup = typeof templatesEndpoints;

export default templatesEndpoints;
