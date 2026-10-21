import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as tontinesApi from '../api/tontines';
import { colors } from '../theme';
import { Card, Pill, ProgressBar, StatusBadge } from './ui';

const STATUS_PILL: Record<tontinesApi.TontineStatus, { label: string; color: string; bg: string } | null> = {
  ACTIVE: null,
  PENDING: { label: 'Recrutement', color: colors.info, bg: colors.infoSoft },
  COMPLETED: { label: 'Terminée', color: colors.success, bg: colors.successSoft },
  CANCELLED: { label: 'Annulée', color: colors.danger, bg: colors.dangerSoft },
};

export default function TontineCard({ t, index, onPress }: {
  t: tontinesApi.TontineSummary; index: number; onPress?: () => void;
}) {
  const router = useRouter();
  const pill = STATUS_PILL[t.status];
  return (
    <Card delay={index} style={{ marginBottom: 10 }}
      onPress={onPress ?? (() => router.push({ pathname: '/tontine/[id]', params: { id: String(t.id) } }))}>
      <View style={s.row}>
        <View style={s.emoji}><Text style={{ fontSize: 22 }}>{t.emoji}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{t.name}</Text>
          <Text style={s.sub}>{t.cotisation} · {t.tourLabel}</Text>
        </View>
        {pill ? <Pill label={pill.label} color={pill.color} bg={pill.bg} />
          : t.myStatus !== 'none' ? <StatusBadge status={t.myStatus} /> : null}
      </View>
      {(t.status === 'ACTIVE' || t.status === 'PENDING') && (
        <View style={{ marginTop: 14 }}>
          <ProgressBar value={t.progress} color={t.status === 'PENDING' ? colors.info : colors.gold} />
        </View>
      )}
      {t.potAction === 'SEND' && <Text style={s.pending}>● Pot à envoyer à {t.potBeneficiary}</Text>}
      {t.potAction === 'RECEIVE' && <Text style={s.pending}>● Réception du pot à confirmer</Text>}
      {t.pendingConfirmations > 0 && (
        <Text style={s.pending}>● {t.pendingConfirmations} paiement{t.pendingConfirmations > 1 ? 's' : ''} à confirmer</Text>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  pending: { marginTop: 10, fontSize: 12, fontWeight: '700', color: colors.info },
});
