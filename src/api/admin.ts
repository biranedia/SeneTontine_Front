// app/api/admin.ts
import { Platform } from 'react-native';
import { api, getRawText } from './client';

export interface PlatformOverview {
  totalUsers: number;
  totalTontines: number;
  activeTontines: number;
  pendingTontines: number;
  totalMoneyTracked: number;
  pendingDeclarations: number;
  totalPaymentsMade: number;
  openIncidents: number;
}

export function overview() {
  return api.get<PlatformOverview>('/admin/overview');
}

export interface AdminUserInfo {
  id: number;
  fullName: string;
  phone: string;
  role: 'MEMBER' | 'ADMIN';
  active: boolean;
  createdAt: string;
}

// query facultatif : recherche par nom ou telephone. Vide/absent = les 100 derniers inscrits.
export function listUsers(query?: string) {
  const q = query && query.trim() ? `?query=${encodeURIComponent(query.trim())}` : '';
  return api.get<AdminUserInfo[]>(`/admin/users${q}`);
}

export function setUserActive(userId: number, active: boolean) {
  return api.post<AdminUserInfo>(`/admin/users/${userId}/active`, { active });
}

export function setUserRole(userId: number, role: 'MEMBER' | 'ADMIN') {
  return api.post<AdminUserInfo>(`/admin/users/${userId}/role`, { role });
}

export interface TontineMembershipItem {
  tontineId: number;
  tontineName: string;
  emoji: string;
  role: string;
}

export interface PaymentHistoryItem {
  tontineId: number;
  tontineName: string;
  roundNumber: number;
  amount: number;
  penaltyAmount: number;
  status: string;
  paidAt: string | null;
}

export interface UserDetailInfo {
  user: AdminUserInfo;
  tontines: TontineMembershipItem[];
  payments: PaymentHistoryItem[];
  incidentsCount: number;
}

export function userDetail(userId: number) {
  return api.get<UserDetailInfo>(`/admin/users/${userId}/detail`);
}

export interface AdminTontineInfo {
  id: number;
  name: string;
  emoji: string;
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  membersCount: number;
  membersRequired: number;
  cotisationAmount: number;
  createdByName: string;
  createdAt: string;
}

export function listTontines() {
  return api.get<AdminTontineInfo[]>('/admin/tontines');
}

export function setTontineStatus(tontineId: number, status: 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'COMPLETED') {
  return api.post<AdminTontineInfo>(`/admin/tontines/${tontineId}/status`, { status });
}




// Export CSV. Sur le web, on declenche un vrai telechargement de fichier via un lien invisible
// (le navigateur gere l'authentification via le header Authorization, contrairement a un
// simple <a href> vers l'URL de l'API qui n'enverrait pas le token). Sur natif (telephone), le
// telechargement de fichier fonctionne differemment (pas de DOM/Blob) : on ne le propose donc
// que sur le web pour l'instant, l'appelant doit verifier Platform.OS avant d'appeler ceci.
export async function downloadCsv(kind: 'users' | 'tontines') {
  const path = kind === 'users' ? '/admin/export/users' : '/admin/export/tontines';
  const csv = await getRawText(path);
  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = kind === 'users' ? 'utilisateurs.csv' : 'tontines.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  return csv;
}

// ---- Tableau de bord analytique ----
export interface Kpi { value: number; previous: number }
export interface DayPoint { day: string; value: number }
export interface Analytics {
  days: number;
  revenue: Kpi; signups: Kpi; tontinesCreated: Kpi; cotisationsVolume: Kpi;
  totalUsers: number; pendingDeclarations: number; openIncidents: number;
  tontinesByStatus: Record<string, number>;
  revenueSeries: DayPoint[]; signupSeries: DayPoint[];
  tontineSeries: DayPoint[]; cotisationSeries: DayPoint[];
  recentRevenue: { id: number; userName: string; purpose: 'CREATE' | 'RENEW'; amount: number; paidAt: string }[];
}

export function analytics(days: 7 | 30 | 90) {
  return api.get<Analytics>(`/admin/analytics?days=${days}`);
}

// Mot de passe oublié : génère un mot de passe temporaire (à transmettre par WhatsApp).
export function resetPassword(userId: number) {
  return api.post<{ temporaryPassword: string }>(`/admin/users/${userId}/reset-password`, {});
}
