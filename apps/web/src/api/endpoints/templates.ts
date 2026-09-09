import { api } from "../client";
import type {
  ApiSingleResponse,
  PaginationParams,
  Template,
} from "../contracts";

export type TemplateInput = {
  name: string;
  description?: string;
  tasks?: { title: string }[];
};

export const templateQueryKeys = {
  list: ["templates", "list"],
  detail: (id: string) => ["templates", id],
} as const;

export const templatesEndpoints = {
  list: (params: PaginationParams = {}) =>
    api.get<Template[]>("/v1/templates", { params }),
  getById: (id: string) =>
    api.get<ApiSingleResponse<Template>>(`/v1/templates/${id}`),
  create: (payload: TemplateInput) =>
    api.post<Template>("/v1/templates", payload),
  update: (id: string, payload: Partial<TemplateInput>) =>
    api.put<Template>(`/v1/templates/${id}`, payload),
  remove: (id: string) => api.delete<unknown>(`/v1/templates/${id}`),
};

export type TemplateEndpointGroup = typeof templatesEndpoints;

export default templatesEndpoints;
