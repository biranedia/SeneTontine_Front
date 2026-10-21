// app/my-reports.tsx — Suivi des signalements soumis par le membre connecte
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius, shadow } from '@/src/theme';
import * as incidentsApi from '@/src/api/incidents';
import { ApiError } from '@/src/api/client';

const CATEGORY_LABELS: Record<incidentsApi.IncidentCategory, string> = {
  FRAUD: '🚨 Fraude suspectée',
  PAYMENT_ISSUE: '💳 Litige de paiement',
  HARASSMENT: '⚠️ Comportement abusif',
  TECHNICAL_BUG: '🐛 Bug technique',
  OTHER: '📝 Autre',
};

const STATUS_STYLES: Record<incidentsApi.IncidentStatus, { label: string; bg: string; fg: string }> = {
  OPEN: { label: 'En attente', bg: '#FDF6E3', fg: '#7A6030' },
  IN_PROGRESS: { label: 'En cours de traitement', bg: '#EAF1FB', fg: '#2A4E8A' },
  RESOLVED: { label: 'Résolu ✓', bg: '#E8F5EC', fg: '#3D6B4F' },
  DISMISSED: { label: 'Rejeté', bg: '#FDECEA', fg: '#C0392B' },
};

export default function MyReportsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<incidentsApi.IncidentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await incidentsApi.mine());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger tes signalements.');
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
        <Text style={s.title}>Mes signalements 📋</Text>
        <Text style={s.subtitle}>{items.length} signalement{items.length > 1 ? 's' : ''} envoyé{items.length > 1 ? 's' : ''}</Text>
      </View>

      {loading ? (
        <View style={[s.center, { flex: 1 }]}><ActivityIndicator color={colors.gold} /></View>
      ) : error ? (
        <View style={[s.center, { flex: 1, paddingHorizontal: 30 }]}><Text style={s.errorText}>{error}</Text></View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
        >
          {items.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🚨</Text>
              <Text style={s.emptyText}>Tu n'as encore rien signalé.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/report-incident')}>
                <Text style={s.emptyBtnText}>Signaler un problème</Text>
              </TouchableOpacity>
            </View>
          ) : (
            items.map((it) => {
              const st = STATUS_STYLES[it.status];
              return (
                <View key={it.id} style={s.card}>
                  <View style={s.cardTop}>
                    <Text style={s.category}>{CATEGORY_LABELS[it.category]}</Text>
                    <View style={[s.badge, { backgroundColor: st.bg }]}>
                      <Text style={[s.badgeText, { color: st.fg }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={s.description}>{it.description}</Text>
                  {it.adminNote && (
                    <View style={s.noteBox}>
                      <Text style={s.noteLabel}>Réponse de l'administration :</Text>
                      <Text style={s.noteText}>{it.adminNote}</Text>
                    </View>
                  )}
                  <Text style={s.date}>{new Date(it.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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

  emptyBox: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  emptyText: { color: colors.gray, fontSize: 13, marginBottom: 16 },
  emptyBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 20 },
  emptyBtnText: { color: colors.deep, fontWeight: '700', fontSize: 13 },

  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  category: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: '700' },
  description: { fontSize: 12, color: colors.earth, lineHeight: 17 },

  noteBox: { backgroundColor: colors.goldPale, borderRadius: radius.sm, padding: 10, marginTop: 10 },
  noteLabel: { fontSize: 10, fontWeight: '700', color: colors.gold, marginBottom: 3 },
  noteText: { fontSize: 12, color: colors.ink, lineHeight: 16 },

  date: { fontSize: 10, color: colors.gray, marginTop: 10 },
});
