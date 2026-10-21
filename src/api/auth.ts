// app/api/auth.ts
import { api } from './client';

export interface AuthResponse {
  userId: number;
  fullName: string;
  phone: string;
  token: string;
  role: 'MEMBER' | 'ADMIN';
}

export function login(phone: string, password: string) {
  return api.post<AuthResponse>('/auth/login', { phone, password });
}

export function register(fullName: string, phone: string, email: string | null, password: string, acceptedTerms: boolean) {
  return api.post<AuthResponse>('/auth/register', { fullName, phone, email, password, acceptedTerms });
}

// Revoque le token cote serveur. Sans cet appel, un token "deconnecte" localement resterait
// valide en base jusqu'a son expiration naturelle.
export function logout() {
  return api.post<void>('/auth/logout', {});
}

export function logoutOthers() {
  return api.post<void>('/auth/logout-others', {});
}
