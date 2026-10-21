// app/api/payments.ts — Suivi des cotisations : l'argent passe par Wave / Orange Money
// directement vers le créateur ; l'app ne fait que déclarer et confirmer.
import { api } from './client';

export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'FREE_MONEY';
export type PaymentStatus = 'DUE' | 'DECLARED' | 'PAID' | 'LATE';

export interface PaymentInfo {
  id: number;
  tontineId: number;
  userId: number;
  memberName: string;
  roundNumber: number;
  amount: number;
  method: PaymentMethod | null;
  status: PaymentStatus;
  declaredAt: string | null;
  confirmedAt: string | null;
  reference: string | null;
  penaltyAmount: number;
}

export interface PotPayoutInfo {
  id: number;
  roundNumber: number;
  beneficiaryId: number;
  beneficiaryName: string;
  amount: number;
  sentAt: string | null;
  receivedAt: string | null;
}

export const methodLabel: Record<PaymentMethod, string> = {
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  FREE_MONEY: 'Free Money',
};

export function declare(tontineId: number, method: PaymentMethod, reference?: string) {
  return api.post<PaymentInfo>(`/tontines/${tontineId}/payments/declare`, { method, reference: reference || null });
}

export function confirm(tontineId: number, paymentId: number) {
  return api.post<PaymentInfo>(`/tontines/${tontineId}/payments/${paymentId}/confirm`);
}

export function reject(tontineId: number, paymentId: number) {
  return api.post<PaymentInfo>(`/tontines/${tontineId}/payments/${paymentId}/reject`);
}

export function history(tontineId: number) {
  return api.get<PaymentInfo[]>(`/tontines/${tontineId}/payments`);
}

export function payouts(tontineId: number) {
  return api.get<PotPayoutInfo[]>(`/tontines/${tontineId}/payouts`);
}

export function markPotSent(tontineId: number, round: number) {
  return api.post<PotPayoutInfo>(`/tontines/${tontineId}/payouts/${round}/sent`);
}

export function markPotReceived(tontineId: number, round: number) {
  return api.post<PotPayoutInfo>(`/tontines/${tontineId}/payouts/${round}/received`);
}
