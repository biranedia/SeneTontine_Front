// app/paiement.tsx — Retour de la page de paiement NabooPay. On ne se fie PAS au fait d'être
// revenu ici : on demande au serveur, qui revérifie auprès de NabooPay.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as billingApi from '@/src/api/billing';
import * as tontinesApi from '@/src/api/tontines';
import { ApiError } from '@/src/api/client';
import { colors, fcfa } from '@/src/theme';
import { Button, Screen } from '@/src/components/ui';

export default function PaymentReturnScreen() {
  const router = useRouter();
  const { ref } = useLocalSearchParams<{ ref?: string }>();
  const paymentId = Number(ref);
  const [info, setInfo] = useState<billingApi.PaymentStatusInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tries = useRef(0);

  useEffect(() => {
    if (!paymentId) { setError('Paiement introuvable.'); return; }
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const r = await billingApi.refresh(paymentId);
        setInfo(r);
        if (r.status === 'PENDING' && tries.current++ < 20) timer = setTimeout(poll, 3000);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Vérification impossible pour le moment.');
      }
    };
    poll();
    return () => clearTimeout(timer);
  }, [paymentId]);

  const next = async () => {
    if (!info) return;
    if (info.purpose === 'CREATE') {
      router.replace({ pathname: '/create-tontine', params: { draft: '1' } });
      return;
    }
    setBusy(true);
    try {
      const t = await tontinesApi.renew(info.tontineId!);
      router.replace({ pathname: '/tontine/[id]', params: { id: String(t.id) } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Renouvellement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const status = error ? 'error' : !info || info.status === 'PENDING' ? 'pending' : info.status === 'PAID' ? 'paid' : 'cancelled';
  const view = {
    pending: { icon: null, title: 'Vérification du paiement…', text: 'Cela prend quelques secondes. Ne ferme pas cette page.' },
    paid: { icon: 'checkmark-circle' as const, title: 'Paiement confirmé', text: `${fcfa(info?.amount)} reçus. Merci !` },
    cancelled: { icon: 'close-circle' as const, title: 'Paiement non abouti', text: "Aucun montant n'a été validé. Tu peux réessayer." },
    error: { icon: 'alert-circle' as const, title: 'Vérification impossible', text: error ?? '' },
  }[status];

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={s.box}>
        {view.icon ? (
          <Ionicons name={view.icon} size={64} color={status === 'paid' ? colors.success : colors.danger} />
        ) : <ActivityIndicator size="large" color={colors.gold} />}
        <Text style={s.title}>{view.title}</Text>
        <Text style={s.text}>{view.text}</Text>
        {status === 'pending' && tries.current > 19 && (
          <Text style={s.text}>Toujours en attente : si tu as bien payé, la confirmation arrivera automatiquement dans quelques minutes (tu recevras une notification).</Text>
        )}
      </View>
      {status === 'paid' && (
        <Button label={info?.purpose === 'CREATE' ? 'Créer ma tontine' : 'Renouveler la tontine'} loading={busy} onPress={next} />
      )}
      <Button label="Retour à l'accueil" variant="ghost" onPress={() => router.replace('/accueil')} style={{ marginTop: 8 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  box: { alignItems: 'center', marginTop: 80, marginBottom: 40, gap: 12 },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  text: { fontSize: 15, color: colors.muted, textAlign: 'center', lineHeight: 22 },
});
