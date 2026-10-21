// src/api/savings.ts — Épargne individuelle (objectifs personnels).
import { api } from './client';

export interface GoalSummary {
  id: number;
  name: string;
  emoji: string;
  targetAmount: number;
  savedAmount: number;
  progress: number;
  periodicAmount: number | null;
  cycleDays: number | null;
  nextDueDate: string | null;
  completed: boolean;
}

export interface EntryInfo {
  id: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface GoalDetail {
  goal: GoalSummary;
  entries: EntryInfo[];
}

export interface CreateGoalRequest {
  name: string;
  emoji?: string;
  targetAmount: number;
  periodicAmount?: number | null;
  cycleDays?: number | null;
}

export const list = () => api.get<GoalSummary[]>('/savings');
export const create = (req: CreateGoalRequest) => api.post<GoalSummary>('/savings', req);
export const detail = (id: number) => api.get<GoalDetail>(`/savings/${id}`);
export const addEntry = (id: number, type: EntryInfo['type'], amount: number, note?: string) =>
  api.post<GoalDetail>(`/savings/${id}/entries`, { type, amount, note: note || null });
export const remove = (id: number) => api.delete<void>(`/savings/${id}`);
