// app/admin/user-detail.tsx — Fiche complete d'un utilisateur (admin uniquement)
// Ouverte depuis admin/users.tsx : reunit en un seul ecran tout ce dont un admin a besoin pour
// instruire un litige sur un compte precis (ses tontines, son historique de paiements, le
// nombre de signalements qu'il a lui-meme soumis), plutot que de naviguer entre plusieurs
// ecrans pour reconstituer le contexte a la main.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { colors, radius, shadow } from '@/src/theme';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';


export default function AdminUserDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const [data, setData] = useState<adminApi.UserDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await adminApi.userDetail(userId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger cette fiche.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const totalPaid = (data?.payments ?? []).reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deep} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Fiche utilisateur 🪪</Text>
      </View>

      {loading ? (
        <View style={[s.center, { flex: 1 }]}><ActivityIndicator color={colors.gold} /></View>
      ) : error || !data ? (
        <View style={[s.center, { flex: 1, paddingHorizontal: 30 }]}><Text style={s.errorText}>{error ?? 'Utilisateur introuvable.'}</Text></View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          <View style={s.identityCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{data.user.fullName}</Text>
              <Text style={s.phone}>{data.user.phone}</Text>
            </View>
            {data.user.role === 'ADMIN' && (
              <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
            )}
          </View>

          <View style={s.tagsRow}>
            <View style={[s.tag, data.user.active ? s.tagOk : s.tagBlocked]}>
              <Text style={s.tagText}>{data.user.active ? 'Actif' : 'Bloqué'}</Text>
            </View>
          </View>
          <Text style={s.since}>Inscrit(e) depuis le {new Date(data.user.createdAt).toLocaleDateString('fr-FR')}</Text>

          <View style={s.statsGrid}>
            <StatBox icon="🤝" value={String(data.tontines.length)} label="Tontines" />
            <StatBox icon="💰" value={`${Math.round(totalPaid / 1000)}K`} label="Payé (FCFA)" />
            <StatBox icon="🚨" value={String(data.incidentsCount)} label="Signalements" />
          </View>

          <Text style={s.sectionTitle}>Tontines ({data.tontines.length})</Text>
          {data.tontines.length === 0 ? (
            <Text style={s.emptyText}>Ne fait partie d'aucune tontine.</Text>
          ) : (
            data.tontines.map((t) => (
              <TouchableOpacity
                key={t.tontineId}
                style={s.row}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/tontine/[id]', params: { id: String(t.tontineId) } })}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{t.tontineName}</Text>
                  <Text style={s.rowSub}>{t.role === 'CREATOR' ? 'Créateur' : 'Membre'}</Text>
                </View>
                <Text style={s.rowArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}

          <Text style={s.sectionTitle}>Paiements effectués ({data.payments.length})</Text>
          {data.payments.length === 0 ? (
            <Text style={s.emptyText}>Aucun paiement effectué pour l'instant.</Text>
          ) : (
            data.payments.map((p, i) => (
              <View key={i} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle}>{p.tontineName} · tour {p.roundNumber}</Text>
                  <Text style={s.rowSub}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString('fr-FR') : ''}{p.penaltyAmount > 0 ? ` · pénalité ${p.penaltyAmount.toLocaleString('fr-FR')} FCFA` : ''}</Text>
                </View>
                <Text style={s.rowAmount}>{(p.amount + p.penaltyAmount).toLocaleString('fr-FR')} FCFA</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatBox({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={{ fontSize: 16, marginBottom: 4 }}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.deep, paddingTop: 54, paddingHorizontal: 24, paddingBottom: 20 },
  back: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  title: { color: colors.cream, fontSize: 20, fontWeight: 'bold' },

  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  emptyText: { color: colors.gray, fontSize: 12, marginBottom: 10 },

  identityCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 18, fontWeight: '700', color: colors.ink },
  phone: { fontSize: 13, color: colors.gray, marginTop: 2 },
  adminBadge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: colors.deep },

  tagsRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tagOk: { backgroundColor: colors.successBg },
  tagNeutral: { backgroundColor: colors.warnBg },
  tagBlocked: { backgroundColor: colors.errorBg },
  tagText: { fontSize: 10, fontWeight: '600', color: colors.earth },
  since: { fontSize: 11, color: colors.gray, marginBottom: 16 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  statValue: { fontSize: 16, fontWeight: 'bold', color: colors.ink },
  statLabel: { fontSize: 9, color: colors.gray, marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.earth, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  rowTitle: { fontSize: 12, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 10, color: colors.gray, marginTop: 2 },
  rowArrow: { color: colors.gold, fontSize: 16, fontWeight: '700' },
  rowAmount: { fontSize: 12, fontWeight: '700', color: colors.sage },
});
