// src/api/notifications.ts
import { apiClient } from '@/services/api';
import {
  API_ENDPOINTS,
  type AppNotification,
  type NotificationList,
  type NotificationListQuery,
  type ReadAllResult,
  type UnreadCount,
} from '@/types/api.contract';

export const notificationsApi = {
  /** GET /v1/notifications: the caller's notifications, newest first. */
  async list(query: NotificationListQuery): Promise<NotificationList> {
    const { data } = await apiClient.get<NotificationList>(API_ENDPOINTS.notifications, { params: query });
    return data;
  },

  /** GET /v1/notifications/unread-count (cheap, for the tab badge). */
  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<UnreadCount>(API_ENDPOINTS.notificationsUnreadCount);
    return data.unreadCount;
  },

  /** PATCH /v1/notifications/:id/read */
  async markRead(id: string): Promise<AppNotification> {
    const { data } = await apiClient.patch<AppNotification>(API_ENDPOINTS.notificationRead(id));
    return data;
  },

  /** POST /v1/notifications/read-all */
  async readAll(): Promise<ReadAllResult> {
    const { data } = await apiClient.post<ReadAllResult>(API_ENDPOINTS.notificationsReadAll);
    return data;
  },
};
