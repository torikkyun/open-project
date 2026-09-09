import { api } from "../client";
import type { ApiSingleResponse, Attachment } from "../contracts";

export const documentQueryKeys = {
  project: (projectId: string) => ["documents", projectId],
  task: (taskId: string) => ["documents", "task", taskId],
  attachment: (id: string) => ["documents", id],
} as const;

export const documentsEndpoints = {
  uploadProject: (projectId: string, formData: FormData) =>
    api.post<ApiSingleResponse<Attachment>>(
      `/v1/projects/${projectId}/attachments`,
      formData,
    ),
  uploadTask: (taskId: string, formData: FormData) =>
    api.post<ApiSingleResponse<Attachment>>(
      `/v1/tasks/${taskId}/attachments`,
      formData,
    ),
  uploadComment: (commentId: string, formData: FormData) =>
    api.post<ApiSingleResponse<Attachment>>(
      `/v1/comments/${commentId}/attachments`,
      formData,
    ),
  download: (id: string) =>
    api.get<Blob>(`/v1/attachments/${id}/download`, {
      skipAuth: false,
      responseType: "blob",
    }),
  listProject: (projectId: string) =>
    api.get<Attachment[]>(`/v1/projects/${projectId}/attachments`),
  listTask: (taskId: string) =>
    api.get<Attachment[]>(`/v1/tasks/${taskId}/attachments`),
};

export type DocumentEndpointGroup = typeof documentsEndpoints;

export default documentsEndpoints;
