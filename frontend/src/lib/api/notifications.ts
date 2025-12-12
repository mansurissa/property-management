import { apiClient } from '../api-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  readAt: string | null;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  meta: {
    total: number;
    unreadCount: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

export const notificationsApi = {
  // Get all notifications
  getNotifications: async (options?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  }): Promise<NotificationsResponse> => {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    if (options?.type) params.append('type', options.type);

    const query = params.toString();
    const response = await apiClient.get<NotificationsResponse>(
      `/in-app-notifications${query ? `?${query}` : ''}`
    );
    return response.data as unknown as NotificationsResponse;
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<UnreadCountResponse>('/in-app-notifications/unread-count');
    return (response.data as any).data?.count || 0;
  },

  // Mark as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.post(`/in-app-notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: async (): Promise<{ markedCount: number }> => {
    const response = await apiClient.post<{ data: { markedCount: number } }>('/in-app-notifications/read-all');
    return (response.data as any).data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/in-app-notifications/${notificationId}`);
  }
};
