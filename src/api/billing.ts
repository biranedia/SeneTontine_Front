// src/api/billing.ts — Paiements créateur via NabooPay (Wave / Orange Money).
// Le prix est fixé par le serveur ; l'app ne fait que lancer le paiement et en suivre l'état.
import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './client';

export type Purpose = 'CREATE' | 'RENEW';

export interface Quote { free: boolean; hasCredit: boolean; price: number; }
export interface PaymentStatusInfo { paymentId: number; purpose: Purpose; tontineId: number | null; status: 'PENDING' | 'PAID' | 'CANCELLED'; amount: number; }

export const quote = (purpose: Purpose, tontineId?: number) =>
  api.get<Quote>(`/billing/quote?purpose=${purpose}${tontineId ? `&tontineId=${tontineId}` : ''}`);

export const refresh = (paymentId: number) => api.post<PaymentStatusInfo>(`/billing/payments/${paymentId}/refresh`);

// Crée la transaction NabooPay puis ouvre sa page de paiement. NabooPay renvoie ensuite
// l'utilisateur sur /paiement?ref=<id>, qui vérifie l'état réel auprès du serveur.
export async function startCheckout(purpose: Purpose, tontineId?: number) {
  const res = await api.post<{ paymentId: number; checkoutUrl: string }>('/billing/checkout', { purpose, tontineId: tontineId ?? null });
  await AsyncStorage.setItem('pending_payment', String(res.paymentId));
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = res.checkoutUrl;
  } else {
    await Linking.openURL(res.checkoutUrl);
  }
  return res.paymentId;
}

// Brouillon du formulaire de création, conservé pendant le paiement.
const DRAFT_KEY = 'tontine_draft';
export const saveDraft = (draft: unknown) => AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
export const loadDraft = async <T,>(): Promise<T | null> => {
  const raw = await AsyncStorage.getItem(DRAFT_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
};
export const clearDraft = () => AsyncStorage.removeItem(DRAFT_KEY);
