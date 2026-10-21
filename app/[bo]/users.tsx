// app/[bo]/users.tsx — Gestion des utilisateurs : recherche, filtres, actions rapides.
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { ABtn, ACard, AdminPage, Badge, Chips, Empty, ErrorBox, Loader, SearchBox, adminHref, fmtDate, st } from '@/src/components/admin/AdminUI';

type Filter = 'all' | 'active' | 'blocked' | 'admin';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user: me } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [users, setUsers] = useState<adminApi.AdminUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      setError(null);
      setUsers(await adminApi.listUsers(q));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(query); }, [load]));

  const visible = useMemo(() => users.filter((u) =>
    !u.phone.startsWith('deleted-') && (
      filter === 'all' || (filter === 'active' && u.active) || (filter === 'blocked' && !u.active) || (filter === 'admin' && u.role === 'ADMIN'))),
  [users, filter]);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      await load(query);
      if (ok) Alert.alert('C’est fait', ok);
    } catch (e) {
      Alert.alert('Action impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setBusy(null);
    }
  };

  const confirm = (title: string, msg: string, label: string, fn: () => void, destructive = false) =>
    Alert.alert(title, msg, [{ text: 'Annuler', style: 'cancel' }, { text: label, style: destructive ? 'destructive' : 'default', onPress: fn }]);

  const exportCsv = () => {
    if (Platform.OS !== 'web') return Alert.alert('Export', 'Disponible depuis un ordinateur.');
    run('export', () => adminApi.downloadCsv('users'));
  };

  const count = (f: Filter) => users.filter((u) => !u.phone.startsWith('deleted-') && (
    f === 'all' || (f === 'active' && u.active) || (f === 'blocked' && !u.active) || (f === 'admin' && u.role === 'ADMIN'))).length;

  return (
    <AdminPage title="Utilisateurs" subtitle="Recherche, blocage, rôles, suppression"
      onRefresh={() => { setLoading(true); load(query); }}
      actions={<ABtn icon="download-outline" label="Exporter CSV" onPress={exportCsv} busy={busy === 'export'} />}>
      <View style={st.toolbar}>
        <SearchBox value={query} onChangeText={setQuery} onSubmit={() => { setLoading(true); load(query); }}
          placeholder="Rechercher par nom ou téléphone…" />
        <ABtn icon="search" label="Rechercher" tone="primary" onPress={() => { setLoading(true); load(query); }} />
      </View>
      <View style={{ marginBottom: 14 }}>
        <Chips value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'Tous', count: count('all') },
          { value: 'active', label: 'Actifs', count: count('active') },
          { value: 'blocked', label: 'Bloqués', count: count('blocked') },
          { value: 'admin', label: 'Admins', count: count('admin') },
        ]} />
      </View>

      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={() => load(query)} /> : (
        <ACard style={{ paddingVertical: 4 }}>
          {visible.length === 0 ? <Empty text="Aucun utilisateur." /> : visible.map((u, i) => {
            const self = me?.phone === u.phone;
            return (
              <View key={u.id} style={[st.row, { flexWrap: 'wrap' }, i === visible.length - 1 && st.rowLast]}>
                <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 220 }}
                  onPress={() => router.push(adminHref('user-detail', { id: String(u.id) }))}>
                  <View style={st.avatar}><Text style={st.avatarText}>{u.fullName.slice(0, 1).toUpperCase()}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.name} numberOfLines={1}>{u.fullName}{self ? ' (toi)' : ''}</Text>
                    <Text style={st.meta}>{u.phone} · inscrit le {fmtDate(u.createdAt)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {u.role === 'ADMIN' && <Badge label="Admin" tone="gold" />}
                    <Badge label={u.active ? 'Actif' : 'Bloqué'} tone={u.active ? 'green' : 'red'} />
                  </View>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <ABtn icon="eye-outline" label="Voir" onPress={() => router.push(adminHref('user-detail', { id: String(u.id) }))} />
                  {!self && (
                    <ABtn icon={u.active ? 'lock-closed-outline' : 'lock-open-outline'} label={u.active ? 'Bloquer' : 'Débloquer'}
                      busy={busy === `a${u.id}`}
                      onPress={() => confirm(u.active ? 'Bloquer ce compte ?' : 'Débloquer ce compte ?',
                        u.active ? `${u.fullName} sera déconnecté et ne pourra plus se connecter.` : `${u.fullName} pourra de nouveau se connecter.`,
                        u.active ? 'Bloquer' : 'Débloquer',
                        () => run(`a${u.id}`, () => adminApi.setUserActive(u.id, !u.active)), u.active)} />
                  )}
                  {!self && u.role !== 'ADMIN' && (
                    <ABtn icon="trash-outline" label="Supprimer" tone="danger" busy={busy === `d${u.id}`}
                      onPress={() => confirm('Supprimer ce compte ?',
                        `Le compte de ${u.fullName} sera anonymisé et fermé. Ses tontines en cours qu’il a créées seront annulées. Action irréversible.`,
                        'Supprimer', () => run(`d${u.id}`, () => adminApi.deleteUser(u.id), 'Compte supprimé.'), true)} />
                  )}
                </View>
              </View>
            );
          })}
        </ACard>
      )}
    </AdminPage>
  );
}
