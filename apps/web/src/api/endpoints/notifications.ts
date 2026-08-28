import { api } from "../client";
import type {
  ApiListResponse,
  ApiSingleResponse,
  Notification,
  PaginationParams,
} from "../contracts";

export const notificationQueryKeys = {
  list: ["notifications", "list"],
  unreadCount: ["notifications", "unread-count"],
} as const;

export const notificationsEndpoints = {
  list: (params: PaginationParams = {}) =>
    api.get<ApiListResponse<Notification>>("/v1/notifications", { params }),
  unreadCount: () =>
    api.get<ApiSingleResponse<number>>("/v1/notifications/unread-count"),
  markAllRead: () =>
    api.patch<ApiSingleResponse<unknown>>("/v1/notifications/read-all", {}),
  markRead: (id: string) =>
    api.patch<ApiSingleResponse<Notification>>(
      `/v1/notifications/${id}/read`,
      {},
    ),
};

export type NotificationEndpointGroup = typeof notificationsEndpoints;

export default notificationsEndpoints;
