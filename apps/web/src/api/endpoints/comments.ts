import { api } from "../client";
import type { ApiListResponse, ApiSingleResponse, Comment } from "../contracts";

export const commentQueryKeys = {
  list: (taskId: string) => ["comments", taskId, "list"],
  detail: (id: string) => ["comments", id],
} as const;

export const commentsEndpoints = {
  list: (taskId: string) =>
    api.get<ApiListResponse<Comment>>(`/v1/tasks/${taskId}/comments`),
  create: (
    taskId: string,
    payload: { content: string; parent_comment_id?: string },
  ) =>
    api.post<ApiSingleResponse<Comment>>(
      `/v1/tasks/${taskId}/comments`,
      payload,
    ),
  update: (id: string, payload: { content: string }) =>
    api.patch<ApiSingleResponse<Comment>>(`/v1/comments/${id}`, payload),
  remove: (id: string) => api.delete<unknown>(`/v1/comments/${id}`),
};

export type CommentEndpointGroup = typeof commentsEndpoints;

export default commentsEndpoints;
