// app/api/stats.ts
import { api } from './client';

export interface TontineBreakdown {
  id: number;
  name: string;
  emoji: string;
  progress: number;
}

export interface UserStatsInfo {
  totalSaved: number;
  monthGain: number;
  activeTontines: number;
  pendingTontines: number;
  paymentsMade: number;
  trustScore: number;
  breakdown: TontineBreakdown[];
}

export function myStats() {
  return api.get<UserStatsInfo>('/stats/me');
}
