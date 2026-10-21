// app/api/announcements.ts
import { api } from './client';

export interface AnnouncementInfo {
  id: number;
  message: string;
  createdByName: string;
  createdAt: string;
}

// Renvoie null s'il n'y a jamais eu d'annonce diffusee sur la plateforme.
export function latest() {
  return api.get<AnnouncementInfo | null>('/announcements/latest');
}

export function history() {
  return api.get<AnnouncementInfo[]>('/admin/announcements');
}

export function broadcast(message: string) {
  return api.post<AnnouncementInfo>('/admin/announcements', { message });
}
