import { api } from "../client";
import type {
  ApiSingleResponse,
  DashboardSummary,
  PaginationParams,
} from "../contracts";

export const dashboardQueryKeys = {
  summary: ["dashboard", "summary"],
  tasks: ["dashboard", "tasks"],
} as const;

export const dashboardEndpoints = {
  getSummary: (params: PaginationParams = {}) =>
    api.get<ApiSingleResponse<DashboardSummary>>("/v1/reports/dashboard", {
      params,
    }),
  getTasks: (params: PaginationParams = {}) =>
    api.get<ApiSingleResponse<DashboardSummary>>("/v1/reports/tasks", {
      params,
    }),
};

export type DashboardEndpointGroup = typeof dashboardEndpoints;

export default dashboardEndpoints;
