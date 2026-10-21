// app/admin/incidents.tsx — File des signalements d'incident (admin uniquement)
// Un membre signale (voir report-incident.tsx), un admin l'examine ici et le fait avancer :
// Prendre en charge -> Résoudre / Rejeter, avec une note optionnelle visible ensuite par le
// membre dans "Mes signalements". Chaque changement de statut est trace dans le journal
// d'audit (voir IncidentService.resolve).
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
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
  OPEN: { label: 'Ouvert', bg: '#FDF6E3', fg: '#7A6030' },
  IN_PROGRESS: { label: 'En cours', bg: '#EAF1FB', fg: '#2A4E8A' },
  RESOLVED: { label: 'Résolu', bg: '#E8F5EC', fg: '#3D6B4F' },
  DISMISSED: { label: 'Rejeté', bg: '#FDECEA', fg: '#C0392B' },
};

const FILTERS: { id: incidentsApi.IncidentStatus | 'ALL'; label: string }[] = [
  { id: 'OPEN', label: 'Ouverts' },
  { id: 'IN_PROGRESS', label: 'En cours' },
  { id: 'ALL', label: 'Tous' },
];

export default function AdminIncidentsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<incidentsApi.IncidentStatus | 'ALL'>('OPEN');
  const [items, setItems] = useState<incidentsApi.IncidentInfo[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: incidentsApi.IncidentStatus | 'ALL') => {
    try {
      setError(null);
      setItems(await incidentsApi.listAll(f === 'ALL' ? undefined : f));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les signalements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(filter); }, [load, filter]));

  const onRefresh = () => { setRefreshing(true); load(filter); };

  const act = (id: number, status: 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED') => {
    const note = notes[id]?.trim();
    setBusyId(id);
    incidentsApi.resolve(id, status, note || undefined)
      .then(() => load(filter))
      .catch((e) => Alert.alert('Action impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.'))
      .finally(() => setBusyId(null));
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deep} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Signalements 🚨</Text>
        <Text style={s.subtitle}>{items.length} signalement{items.length > 1 ? 's' : ''}</Text>

        <View style={s.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[s.filterChip, filter === f.id && s.filterChipSel]}
              onPress={() => { setFilter(f.id); setLoading(true); }}
            >
              <Text style={[s.filterChipText, filter === f.id && { color: colors.deep }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
          {items.length === 0 && <Text style={s.emptyText}>Rien à traiter ici pour l'instant 👍</Text>}

          {items.map((it) => {
            const st = STATUS_STYLES[it.status];
            const isFinal = it.status === 'RESOLVED' || it.status === 'DISMISSED';
            return (
              <View key={it.id} style={s.card}>
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.category}>{CATEGORY_LABELS[it.category]}</Text>
                    <Text style={s.reporter}>par {it.reporterName} · {new Date(it.createdAt).toLocaleDateString('fr-FR')}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: st.bg }]}>
                    <Text style={[s.badgeText, { color: st.fg }]}>{st.label}</Text>
                  </View>
                </View>

                <Text style={s.description}>{it.description}</Text>

                {isFinal ? (
                  it.adminNote ? (
                    <View style={s.noteBox}>
                      <Text style={s.noteLabel}>Note ({it.resolvedByName}) :</Text>
                      <Text style={s.noteText}>{it.adminNote}</Text>
                    </View>
                  ) : null
                ) : busyId === it.id ? (
                  <ActivityIndicator color={colors.gold} style={{ marginTop: 10 }} />
                ) : (
                  <>
                    <TextInput
                      style={s.noteInput}
                      placeholder="Note pour le membre (optionnel)..."
                      placeholderTextColor={colors.gray}
                      value={notes[it.id] ?? ''}
                      onChangeText={(t) => setNotes((prev) => ({ ...prev, [it.id]: t }))}
                      multiline
                    />
                    <View style={s.actionsRow}>
                      {it.status === 'OPEN' && (
                        <TouchableOpacity style={s.actionBtn} onPress={() => act(it.id, 'IN_PROGRESS')}>
                          <Text style={s.actionBtnText}>🔍 Prendre en charge</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[s.actionBtn, s.actionBtnGood]} onPress={() => act(it.id, 'RESOLVED')}>
                        <Text style={[s.actionBtnText, { color: colors.sage }]}>✓ Résoudre</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[s.actionBtn, s.actionBtnBad]} onPress={() => act(it.id, 'DISMISSED')}>
                        <Text style={[s.actionBtnText, { color: colors.error }]}>✕ Rejeter</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.deep, paddingTop: 54, paddingHorizontal: 24, paddingBottom: 16 },
  back: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  title: { color: colors.cream, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 3, marginBottom: 12 },

  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, backgroundColor: colors.deepAlt },
  filterChipSel: { backgroundColor: colors.gold },
  filterChipText: { fontSize: 11, fontWeight: '600', color: colors.cream },

  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  emptyText: { color: colors.gray, fontSize: 13, textAlign: 'center', marginTop: 20 },

  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  category: { fontSize: 13, fontWeight: '700', color: colors.ink },
  reporter: { fontSize: 11, color: colors.gray, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: '700' },
  description: { fontSize: 12, color: colors.earth, lineHeight: 17, marginBottom: 10 },

  noteBox: { backgroundColor: colors.goldPale, borderRadius: radius.sm, padding: 10 },
  noteLabel: { fontSize: 10, fontWeight: '700', color: colors.gold, marginBottom: 3 },
  noteText: { fontSize: 12, color: colors.ink, lineHeight: 16 },

  noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 8, fontSize: 12, color: colors.ink, minHeight: 40, marginBottom: 8, backgroundColor: colors.bg },
  actionsRow: { flexDirection: 'row', gap: 6 },
  actionBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.sm, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionBtnGood: { borderColor: colors.sage },
  actionBtnBad: { borderColor: colors.error },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: colors.earth },
});
