// app/api/notifications.ts
import { api } from './client';

export interface NotificationInfo {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function list() {
  return api.get<NotificationInfo[]>('/notifications');
}

export function unreadCount() {
  return api.get<{ count: number }>('/notifications/unread-count');
}

export function markRead(id: number) {
  return api.post<void>(`/notifications/${id}/read`, undefined);
}

export function markAllRead() {
  return api.post<void>('/notifications/read-all', undefined);
}
