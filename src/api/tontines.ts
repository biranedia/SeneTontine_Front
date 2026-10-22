// app/api/tontines.ts
import { api } from './client';
import type { MemberStatus } from '../theme';

export type TontineStatus = 'ACTIVE' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
export type RotationType = 'RANDOM' | 'GROUP_VOTE' | 'FIXED_ORDER' | 'BY_SCORE';

export interface TontineSummary {
  id: number;
  name: string;
  emoji: string;
  members: number;
  tourLabel: string;
  cotisation: string;
  cotisationValue: number;
  prochainTour: string;
  beneficiaire: string;
  status: TontineStatus;
  progress: number;
  // Statut de MA cotisation du tour en cours ('none' si la tontine n'est pas active).
  myStatus: MemberStatus | 'none';
  iAmCreator: boolean;
  // Déclarations en attente de MA confirmation (si je suis le créateur).
  pendingConfirmations: number;
  // Pot en attente me concernant (même après la fin de la tontine) : à envoyer ou à confirmer.
  potAction: 'SEND' | 'RECEIVE' | null;
  potAmount: number | null;
  potBeneficiary: string | null;
}

export interface MemberInfo {
  id: number;
  name: string;
  initials: string;
  role: string;
  status: MemberStatus;
  creator: boolean;
  turnOrder: number | null;
  paymentId: number | null;
  paymentReference: string | null;
  paymentMethod: string | null;
  amountDue: number;
  avatarBase64: string | null;
}

export interface TontineDetail {
  id: number;
  name: string;
  emoji: string;
  members: number;
  tourLabel: string;
  cotisation: string;
  cotisationValue: number;
  prochainTour: string;
  beneficiaire: string;
  status: TontineStatus;
  progress: number;
  createdBy: string;
  potTotal: string;
  membersList: MemberInfo[];
  inviteCode: string;
  membersRequired: number;
  currentRound: number;
  cycleDurationDays: number;
  rotationType: RotationType;
  penaltyPerDay: number;
  isPublic: boolean;
  wavePhone: string | null;
  orangeMoneyPhone: string | null;
  startDate: string | null;
}

export interface TontineSettings {
  name: string;
  cotisationAmount: number;
  membersRequired: number;
  rotationType?: RotationType;
  penaltyPerDay?: number;
  makePublic?: boolean;
  cycleDurationDays?: number;
  wavePhone?: string | null;
  orangeMoneyPhone?: string | null;
  startDate?: string | null; // AAAA-MM-JJ
}

export interface LeaveTontineResponse {
  settleWithCreator: boolean;
  amountPaidThisRound: number;
}

export function listMine() {
  return api.get<TontineSummary[]>('/tontines');
}

export function discover() {
  return api.get<TontineSummary[]>('/tontines/discover');
}

export function getDetail(id: number) {
  return api.get<TontineDetail>(`/tontines/${id}`);
}

export function create(req: TontineSettings) {
  return api.post<TontineSummary>('/tontines', req);
}

export function update(id: number, req: TontineSettings) {
  return api.put<TontineDetail>(`/tontines/${id}`, req);
}

export function join(id: number) {
  return api.post<TontineSummary>(`/tontines/${id}/join`);
}

export function joinByCode(inviteCode: string) {
  return api.post<TontineSummary>('/tontines/join', { inviteCode });
}

export function addMemberByPhone(tontineId: number, phone: string) {
  return api.post<TontineSummary>(`/tontines/${tontineId}/members`, { phone });
}

export function leave(tontineId: number) {
  return api.post<LeaveTontineResponse>(`/tontines/${tontineId}/leave`);
}

// Renouveler une tontine terminée (créateur). Le droit de renouvellement doit avoir été payé.
export function renew(tontineId: number) {
  return api.post<TontineSummary>(`/tontines/${tontineId}/renew`);
}
