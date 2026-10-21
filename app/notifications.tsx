// app/notifications.tsx
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as notificationsApi from '@/src/api/notifications';
import { colors } from '@/src/theme';
import { Card, EmptyState, IconName, PageHeader, Screen } from '@/src/components/ui';

const META: Record<string, { icon: IconName; color: string; bg: string }> = {
  PAYMENT_DECLARED: { icon: 'cash-outline', color: colors.info, bg: colors.infoSoft },
  PAYMENT_CONFIRMED: { icon: 'checkmark-circle-outline', color: colors.success, bg: colors.successSoft },
  PAYMENT_REJECTED: { icon: 'alert-circle-outline', color: colors.danger, bg: colors.dangerSoft },
  PAYMENT_REMINDER: { icon: 'alarm-outline', color: colors.warning, bg: colors.warningSoft },
  POT_TO_SEND: { icon: 'send-outline', color: colors.goldDark, bg: colors.goldSoft },
  POT_SENT: { icon: 'gift-outline', color: colors.goldDark, bg: colors.goldSoft },
  POT_RECEIVED: { icon: 'checkmark-done-outline', color: colors.success, bg: colors.successSoft },
  ROUND_COMPLETED: { icon: 'refresh-circle-outline', color: colors.success, bg: colors.successSoft },
  TONTINE_COMPLETED: { icon: 'trophy-outline', color: colors.goldDark, bg: colors.goldSoft },
  ADDED_TO_TONTINE: { icon: 'people-outline', color: colors.info, bg: colors.infoSoft },
  MEMBER_LEFT: { icon: 'exit-outline', color: colors.muted, bg: colors.surfaceAlt },
};
const DEFAULT_META = { icon: 'notifications-outline' as IconName, color: colors.muted, bg: colors.surfaceAlt };

function relative(iso: string) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return 'À l’instant';
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<notificationsApi.NotificationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.list();
      setItems(data);
      if (data.some((n) => !n.read)) notificationsApi.markAllRead().catch(() => {});
    } catch {
      // liste précédente conservée
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <PageHeader back title="Notifications" />
      {!loading && items.length === 0 ? (
        <EmptyState icon="notifications-off-outline" title="Aucune notification" text="Tu seras prévenu ici des paiements, confirmations et versements." />
      ) : items.map((n, i) => {
        const m = META[n.type] ?? DEFAULT_META;
        return (
          <Card key={n.id} delay={i} style={[{ marginBottom: 10 }, !n.read && { borderColor: colors.gold }]}>
            <View style={s.row}>
              <View style={[s.icon, { backgroundColor: m.bg }]}><Ionicons name={m.icon} size={20} color={m.color} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{n.title}</Text>
                <Text style={s.body}>{n.body}</Text>
                <Text style={s.time}>{relative(n.createdAt)}</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  body: { fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 19 },
  time: { fontSize: 11, color: colors.subtle, marginTop: 6 },
});
