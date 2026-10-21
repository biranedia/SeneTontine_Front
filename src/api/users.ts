// app/api/users.ts
import { api } from './client';

export interface ProfileInfo {
  userId: number;
  fullName: string;
  phone: string;
  role: 'MEMBER' | 'ADMIN';
  trustScore: number;
  avatarBase64: string | null;
}

export function me() {
  return api.get<ProfileInfo>('/users/me');
}

export function updateAvatar(avatarBase64: string) {
  return api.put<ProfileInfo>('/users/me/avatar', { avatarBase64 });
}

export function updateName(fullName: string) {
  return api.put<ProfileInfo>('/users/me/name', { fullName });
}

// Suppression définitive (anonymisation) du compte — exigée par Google Play.
export function deleteAccount(password: string) {
  return api.post<void>('/users/me/delete', { password });
}
