import { api } from "../client";
import type {
  ApiSingleResponse,
  DashboardSummary,
  PaginationParams,
} from "../contracts";

export const reportQueryKeys = {
  dashboard: ["reports", "dashboard"],
  tasks: ["reports", "tasks"],
} as const;

export const reportsEndpoints = {
  dashboard: (params: PaginationParams = {}) =>
    api.get<DashboardSummary>("/v1/reports/dashboard", { params }),
  tasks: (params: PaginationParams = {}) =>
    api.get<ApiSingleResponse<DashboardSummary>>("/v1/reports/tasks", {
      params,
    }),
  exportTasksCsv: (params: PaginationParams = {}) =>
    api.get<Blob>("/v1/reports/tasks/export", {
      params,
      responseType: "blob",
    }),
};

export type ReportEndpointGroup = typeof reportsEndpoints;

export default reportsEndpoints;
