// app/[bo]/tontines.tsx — Toutes les tontines : recherche, filtres par statut, annulation.
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';
import { fcfa } from '@/src/theme';
import { ABtn, ACard, AdminPage, Badge, Chips, Empty, ErrorBox, Loader, SearchBox, fmtDate, st } from '@/src/components/admin/AdminUI';

type Status = adminApi.AdminTontineInfo['status'];
type Filter = 'ALL' | Status;
const LABEL: Record<Status, { label: string; tone: 'green' | 'orange' | 'blue' | 'gray' }> = {
  ACTIVE: { label: 'Active', tone: 'green' }, PENDING: { label: 'En recrutement', tone: 'orange' },
  COMPLETED: { label: 'Terminée', tone: 'blue' }, CANCELLED: { label: 'Annulée', tone: 'gray' },
};

export default function AdminTontinesScreen() {
  const [list, setList] = useState<adminApi.AdminTontineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setList(await adminApi.listTontines());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les tontines.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter((t) => (filter === 'ALL' || t.status === filter) &&
      (!q || t.name.toLowerCase().includes(q) || t.createdByName.toLowerCase().includes(q)));
  }, [list, filter, query]);

  const setStatus = (t: adminApi.AdminTontineInfo, status: Status, verb: string, destructive = false) =>
    Alert.alert(`${verb} « ${t.name} » ?`,
      status === 'CANCELLED' ? 'La tontine sera retirée des listes des membres. L’historique est conservé.' : 'Le statut de la tontine sera modifié.',
      [{ text: 'Annuler', style: 'cancel' }, { text: verb, style: destructive ? 'destructive' : 'default', onPress: async () => {
        setBusy(`${t.id}`);
        try {
          const u = await adminApi.setTontineStatus(t.id, status);
          setList((prev) => prev.map((x) => (x.id === u.id ? u : x)));
        } catch (e) {
          Alert.alert('Action impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
        } finally {
          setBusy(null);
        }
      } }]);

  const count = (f: Filter) => list.filter((t) => f === 'ALL' || t.status === f).length;

  return (
    <AdminPage title="Tontines" subtitle="Toutes les tontines de la plateforme" onRefresh={() => { setLoading(true); load(); }}
      actions={<ABtn icon="download-outline" label="Exporter CSV" busy={busy === 'export'} onPress={async () => {
        if (Platform.OS !== 'web') return Alert.alert('Export', 'Disponible depuis un ordinateur.');
        setBusy('export');
        try { await adminApi.downloadCsv('tontines'); } catch (e) { Alert.alert('Export impossible', e instanceof ApiError ? e.message : ''); }
        finally { setBusy(null); }
      }} />}>
      <View style={st.toolbar}>
        <SearchBox value={query} onChangeText={setQuery} placeholder="Rechercher une tontine ou un créateur…" />
      </View>
      <View style={{ marginBottom: 14 }}>
        <Chips value={filter} onChange={setFilter} options={[
          { value: 'ALL', label: 'Toutes', count: count('ALL') },
          { value: 'ACTIVE', label: 'Actives', count: count('ACTIVE') },
          { value: 'PENDING', label: 'En recrutement', count: count('PENDING') },
          { value: 'COMPLETED', label: 'Terminées', count: count('COMPLETED') },
          { value: 'CANCELLED', label: 'Annulées', count: count('CANCELLED') },
        ]} />
      </View>

      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={load} /> : (
        <ACard style={{ paddingVertical: 4 }}>
          {visible.length === 0 ? <Empty text="Aucune tontine." /> : visible.map((t, i) => (
            <View key={t.id} style={[st.row, { flexWrap: 'wrap' }, i === visible.length - 1 && st.rowLast]}>
              <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
              <View style={{ flex: 1, minWidth: 200 }}>
                <Text style={st.name}>{t.name}</Text>
                <Text style={st.meta}>
                  par {t.createdByName} · {t.membersCount}/{t.membersRequired} membres · {fcfa(t.cotisationAmount)} · créée le {fmtDate(t.createdAt)}
                </Text>
              </View>
              <Badge label={LABEL[t.status].label} tone={LABEL[t.status].tone} />
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(t.status === 'ACTIVE' || t.status === 'PENDING') && (
                  <ABtn icon="close-circle-outline" label="Annuler" tone="danger" busy={busy === `${t.id}`}
                    onPress={() => setStatus(t, 'CANCELLED', 'Annuler', true)} />
                )}
                {t.status === 'CANCELLED' && (
                  <ABtn icon="refresh-outline" label="Réactiver" busy={busy === `${t.id}`}
                    onPress={() => setStatus(t, 'PENDING', 'Réactiver')} />
                )}
              </View>
            </View>
          ))}
        </ACard>
      )}
    </AdminPage>
  );
}
