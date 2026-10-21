// app/api/incidents.ts
import { api } from './client';

export type IncidentCategory = 'FRAUD' | 'PAYMENT_ISSUE' | 'HARASSMENT' | 'TECHNICAL_BUG' | 'OTHER';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface IncidentInfo {
  id: number;
  reporterName: string;
  category: IncidentCategory;
  targetType: string | null;
  targetId: number | null;
  description: string;
  status: IncidentStatus;
  adminNote: string | null;
  resolvedByName: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

// targetType/targetId facultatifs : a fournir quand le signalement concerne une tontine
// precise (ex: "TONTINE" + son id), depuis l'ecran de cette tontine.
export function submit(category: IncidentCategory, description: string, targetType?: string, targetId?: number) {
  return api.post<IncidentInfo>('/incidents', { category, description, targetType, targetId });
}

export function mine() {
  return api.get<IncidentInfo[]>('/incidents/mine');
}

// statusFilter facultatif : par defaut la file "OPEN" est ce qu'un admin veut voir en priorite.
export function listAll(statusFilter?: IncidentStatus) {
  const q = statusFilter ? `?status=${statusFilter}` : '';
  return api.get<IncidentInfo[]>(`/admin/incidents${q}`);
}

export function resolve(id: number, status: 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED', adminNote?: string) {
  return api.post<IncidentInfo>(`/admin/incidents/${id}/resolve`, { status, adminNote });
}
