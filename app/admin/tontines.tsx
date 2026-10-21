// app/admin/tontines.tsx — Supervision de toutes les tontines de la plateforme (admin uniquement)
// Permet de reperer rapidement une tontine anormale (montant suspect, blocage de recrutement...),
// d'en ouvrir le detail normal (TontineService.getDetail laisse deja passer un admin sur
// n'importe quelle tontine, meme s'il n'en est pas membre), de moderer son chat, de forcer son
// statut (ex: annuler une tontine bloquee/frauduleuse), et d'exporter la liste en CSV.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius, shadow } from '@/src/theme';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';

const STATUS_LABELS: Record<adminApi.AdminTontineInfo['status'], string> = {
  ACTIVE: 'ACTIVE',
  PENDING: 'EN ATTENTE',
  CANCELLED: 'ANNULÉE',
  COMPLETED: 'TERMINÉE',
};

export default function AdminTontinesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<adminApi.AdminTontineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await adminApi.listTontines());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les tontines.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(); };

  const onExport = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Export disponible sur le web', "Ouvre l'app dans un navigateur PC pour télécharger le fichier CSV.");
      return;
    }
    setExporting(true);
    try {
      await adminApi.downloadCsv('tontines');
    } catch (e) {
      Alert.alert('Export impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setExporting(false);
    }
  };

  const onCancel = (t: adminApi.AdminTontineInfo) => {
    Alert.alert(
      'Annuler cette tontine ?',
      `"${t.name}" sera marquée comme annulée. L'historique (membres, paiements) est conservé, mais elle disparaît des listes actives des membres.`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la tontine', style: 'destructive', onPress: async () => {
            setBusyId(t.id);
            try {
              const updated = await adminApi.setTontineStatus(t.id, 'CANCELLED');
              setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
            } catch (e) {
              Alert.alert('Action impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deep} />
      <View style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.back}>← Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onExport} disabled={exporting} style={s.exportBtn}>
            {exporting ? <ActivityIndicator color={colors.gold} size="small" /> : <Text style={s.exportBtnText}>⬇️ Exporter CSV</Text>}
          </TouchableOpacity>
        </View>
        <Text style={s.title}>Toutes les tontines 🤝</Text>
        <Text style={s.subtitle}>{items.length} tontine{items.length > 1 ? 's' : ''} sur la plateforme</Text>
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
          {items.length === 0 && <Text style={s.emptyText}>Aucune tontine sur la plateforme pour l'instant.</Text>}

          {items.map((t) => (
            <View key={t.id} style={s.card}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/tontine/[id]', params: { id: String(t.id) } })}
              >
                <View style={s.cardTop}>
                  <Text style={s.emoji}>{t.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{t.name}</Text>
                    <Text style={s.meta}>Créée par {t.createdByName}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: t.status === 'ACTIVE' ? '#D2B95B22' : t.status === 'CANCELLED' ? '#C0392B22' : '#88888822' }]}>
                    <Text style={[s.badgeText, { color: t.status === 'ACTIVE' ? colors.gold : t.status === 'CANCELLED' ? colors.error : '#888' }]}>
                      {STATUS_LABELS[t.status]}
                    </Text>
                  </View>
                </View>
                <View style={s.statsRow}>
                  <Text style={s.stat}>👥 {t.membersCount}/{t.membersRequired}</Text>
                  <Text style={s.stat}>💰 {t.cotisationAmount.toLocaleString('fr-FR')} FCFA</Text>
                </View>
              </TouchableOpacity>

              {busyId === t.id ? (
                <ActivityIndicator color={colors.gold} style={{ marginTop: 10 }} />
              ) : (
                <View style={s.actionsRow}>
                  {t.status !== 'CANCELLED' && (
                    <TouchableOpacity style={[s.actionBtn, s.actionBtnDanger]} onPress={() => onCancel(t)}>
                      <Text style={[s.actionBtnText, { color: colors.error }]}>✕ Annuler</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: colors.deep, paddingTop: 54, paddingHorizontal: 24, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  back: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  exportBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.deepAlt },
  exportBtnText: { color: colors.gold, fontSize: 11, fontWeight: '600' },
  title: { color: colors.cream, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 3 },

  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  emptyText: { color: colors.gray, fontSize: 13, textAlign: 'center', marginTop: 20 },

  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 24 },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 11, color: colors.gray, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  stat: { fontSize: 12, color: colors.earth, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionBtnDanger: { borderColor: colors.error },
  actionBtnText: { fontSize: 11, fontWeight: '700', color: colors.earth },
});
