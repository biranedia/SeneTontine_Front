// app/admin/overview.tsx — Vue d'ensemble de la plateforme (admin uniquement)
// Reserve aux comptes ADMIN cote back (AdminService.requireAdmin) - si un membre normal
// force l'URL, l'appel API renverra un 403 et l'ecran affichera juste l'erreur, aucune
// donnee sensible n'est exposee avant validation cote serveur.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius, shadow } from '@/src/theme';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';

export default function AdminOverviewScreen() {
  const router = useRouter();
  const [data, setData] = useState<adminApi.PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await adminApi.overview());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger la vue d\'ensemble.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deep} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Vue d'ensemble ⚙️</Text>
        <Text style={s.subtitle}>Toute la plateforme, en un coup d'œil</Text>
      </View>

      {loading ? (
        <View style={[s.center, { flex: 1 }]}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : error && !data ? (
        <View style={[s.center, { flex: 1, paddingHorizontal: 30 }]}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : data ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          <View style={s.bigCard}>
            <Text style={s.bigLabel}>COTISATIONS CONFIRMÉES (SUIVIES)</Text>
            <Text style={s.bigValue}>{data.totalMoneyTracked.toLocaleString('fr-FR')} <Text style={s.bigCurrency}>FCFA</Text></Text>
            <Text style={s.bigMeta}>{data.totalPaymentsMade} paiement{data.totalPaymentsMade > 1 ? 's' : ''} effectué{data.totalPaymentsMade > 1 ? 's' : ''} au total</Text>
          </View>

          {/* Alertes actionnables en premier : ce qui demande une action de l'admin doit se voir
              avant les chiffres purement informatifs. */}
          {data.openIncidents > 0 && (
            <View style={s.alertsBox}>
              {data.openIncidents > 0 && (
                <TouchableOpacity style={s.alertRow} onPress={() => router.push('/admin/incidents')} activeOpacity={0.7}>
                  <Text style={s.alertIcon}>🚨</Text>
                  <Text style={s.alertText}>{data.openIncidents} signalement{data.openIncidents > 1 ? 's' : ''} à traiter</Text>
                  <Text style={s.alertArrow}>→</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={s.sectionTitle}>Utilisateurs</Text>
          <View style={s.grid}>
            <StatCard icon="👥" value={String(data.totalUsers)} label="Comptes créés" />
            <StatCard icon="⏳" value={String(data.pendingDeclarations)} label="Paiements à confirmer" />
          </View>
          <TouchableOpacity style={s.linkBtn} onPress={() => router.push('/admin/users')} activeOpacity={0.8}>
            <Text style={s.linkBtnText}>👤 Gérer les utilisateurs</Text>
            <Text style={s.linkBtnArrow}>→</Text>
          </TouchableOpacity>

          <Text style={s.sectionTitle}>Tontines</Text>
          <View style={s.grid}>
            <StatCard icon="🤝" value={String(data.totalTontines)} label="Total" />
            <StatCard icon="🟢" value={String(data.activeTontines)} label="Actives" />
            <StatCard icon="🕓" value={String(data.pendingTontines)} label="En recrutement" />
          </View>
          <TouchableOpacity style={s.linkBtn} onPress={() => router.push('/admin/tontines')} activeOpacity={0.8}>
            <Text style={s.linkBtnText}>🤝 Voir toutes les tontines</Text>
            <Text style={s.linkBtnArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </View>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={{ fontSize: 18, marginBottom: 6 }}>{icon}</Text>
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
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 3 },

  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },

  bigCard: { backgroundColor: colors.deep, borderRadius: radius.xl, padding: 20, marginBottom: 16, ...shadow.card, shadowOpacity: 0.18 },
  bigLabel: { color: colors.gray, fontSize: 11, letterSpacing: 1 },
  bigValue: { color: colors.goldLight, fontSize: 28, fontWeight: 'bold', marginTop: 6 },
  bigCurrency: { fontSize: 15, opacity: 0.7 },
  bigMeta: { color: colors.gray, fontSize: 12, marginTop: 6 },

  alertsBox: { marginBottom: 20, gap: 8 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.goldPale, borderWidth: 1, borderColor: 'rgba(210,185,91,0.35)', borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 },
  alertIcon: { fontSize: 16 },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.earth },
  alertArrow: { color: colors.gold, fontSize: 16, fontWeight: '700' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.earth, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginTop: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  linkBtnText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink },
  linkBtnArrow: { color: colors.gold, fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 6 },
  statCard: { flexGrow: 1, minWidth: '30%', backgroundColor: colors.white, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.ink },
  statLabel: { fontSize: 10, color: colors.gray, marginTop: 2 },
});
