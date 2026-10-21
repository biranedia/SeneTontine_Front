// app/api/activity.ts
import { api } from './client';

export interface ActivityItem {
  type: 'CONTRIBUTION' | 'PAYOUT';
  label: string;
  amount: number; // negatif = cotisation payee, positif = pot reçu
  date: string | null;
}

export interface UserStats {
  activeTontines: number;
  totalContributed: number;
  paymentsCount: number;
}

export function history() {
  return api.get<ActivityItem[]>('/users/me/history');
}

export function stats() {
  return api.get<UserStats>('/users/me/stats');
}
