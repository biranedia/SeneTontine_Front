// app/admin/users.tsx — Gestion des utilisateurs (admin uniquement)
// Recherche + liste des comptes, avec possibilite de bloquer/debloquer un compte ou de
// changer son role, d'ouvrir la fiche complete d'un utilisateur (historique tontines/paiements/
// signalements), et d'exporter la liste en CSV. Toute action passe par l'API (jamais de
// logique cote client) : le serveur revalide systematiquement les garde-fous (pas
// d'auto-modification, pas de blocage direct d'un autre admin, jamais retrograder le dernier
// admin - voir AdminService).
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, TextInput, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius, shadow } from '@/src/theme';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';


export default function AdminUsersScreen() {
  const router = useRouter();
  const { user: me } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<adminApi.AdminUserInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      setError(null);
      setUsers(await adminApi.listUsers(q));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(query); }, [load]));

  const onRefresh = () => { setRefreshing(true); load(query); };
  const onSearch = () => { setLoading(true); load(query); };

  const onExport = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Export disponible sur le web', "Ouvre l'app dans un navigateur PC pour télécharger le fichier CSV.");
      return;
    }
    setExporting(true);
    try {
      await adminApi.downloadCsv('users');
    } catch (e) {
      Alert.alert('Export impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setExporting(false);
    }
  };

  const toggleActive = (u: adminApi.AdminUserInfo) => {
    const willBlock = u.active;
    Alert.alert(
      willBlock ? 'Bloquer ce compte ?' : 'Débloquer ce compte ?',
      willBlock
        ? `${u.fullName} ne pourra plus se connecter, et sera immédiatement déconnecté(e) de toute session active.`
        : `${u.fullName} pourra à nouveau se connecter normalement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: willBlock ? 'Bloquer' : 'Débloquer',
          style: willBlock ? 'destructive' : 'default',
          onPress: async () => {
            setBusyId(u.id);
            try {
              const updated = await adminApi.setUserActive(u.id, !willBlock);
              setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
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

  const toggleRole = (u: adminApi.AdminUserInfo) => {
    const promote = u.role === 'MEMBER';
    Alert.alert(
      promote ? 'Nommer administrateur ?' : 'Retirer les droits admin ?',
      promote
        ? `${u.fullName} aura accès à toutes les fonctions d'administration de la plateforme.`
        : `${u.fullName} redeviendra un membre normal.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: promote ? 'Nommer admin' : 'Rétrograder',
          style: promote ? 'default' : 'destructive',
          onPress: async () => {
            setBusyId(u.id);
            try {
              const updated = await adminApi.setUserRole(u.id, promote ? 'ADMIN' : 'MEMBER');
              setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
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
        <Text style={s.title}>Utilisateurs 👤</Text>
        <Text style={s.subtitle}>{users.length} compte{users.length > 1 ? 's' : ''} affiché{users.length > 1 ? 's' : ''}</Text>

        <View style={s.searchRow}>
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher par nom ou téléphone..."
            placeholderTextColor={colors.gray}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={onSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={s.searchBtn} onPress={onSearch}>
            <Text style={{ fontSize: 15 }}>🔍</Text>
          </TouchableOpacity>
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
          {users.length === 0 && <Text style={s.emptyText}>Aucun utilisateur trouvé.</Text>}

          {users.map((u) => {
            const isSelf = u.id === me?.userId;
            return (
              <TouchableOpacity
                key={u.id}
                style={[s.card, !u.active && s.cardBlocked]}
                activeOpacity={0.85}
                onPress={() => router.push({ pathname: '/admin/user-detail', params: { id: String(u.id) } })}
              >
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name}>{u.fullName}</Text>
                    <Text style={s.phone}>{u.phone}</Text>
                  </View>
                  {u.role === 'ADMIN' && (
                    <View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN</Text></View>
                  )}
                </View>

                <View style={s.tagsRow}>
                  <View style={[s.tag, u.active ? s.tagOk : s.tagBlocked]}>
                    <Text style={s.tagText}>{u.active ? 'Actif' : 'Bloqué'}</Text>
                  </View>
                </View>

                {isSelf ? (
                  <Text style={s.selfHint}>C'est ton propre compte — actions désactivées ici.</Text>
                ) : busyId === u.id ? (
                  <ActivityIndicator color={colors.gold} style={{ marginTop: 10 }} />
                ) : (
                  <View style={s.actionsRow}>
                    <TouchableOpacity style={s.actionBtn} onPress={(e) => { e.stopPropagation?.(); toggleActive(u); }}>
                      <Text style={s.actionBtnText}>{u.active ? '🚫 Bloquer' : '✅ Débloquer'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.actionBtn} onPress={(e) => { e.stopPropagation?.(); toggleRole(u); }}>
                      <Text style={s.actionBtnText}>{u.role === 'MEMBER' ? '⬆️ Nommer admin' : '⬇️ Rétrograder'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
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
  header: { backgroundColor: colors.deep, paddingTop: 54, paddingHorizontal: 24, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  back: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  exportBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.deepAlt },
  exportBtnText: { color: colors.gold, fontSize: 11, fontWeight: '600' },
  title: { color: colors.cream, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 3, marginBottom: 14 },

  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, backgroundColor: colors.deepAlt, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 11, color: colors.cream, fontSize: 13 },
  searchBtn: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.deepAlt, alignItems: 'center', justifyContent: 'center' },

  errorText: { color: colors.error, fontSize: 13, textAlign: 'center' },
  emptyText: { color: colors.gray, fontSize: 13, textAlign: 'center', marginTop: 20 },

  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardBlocked: { borderColor: colors.error, backgroundColor: colors.errorBg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink },
  phone: { fontSize: 12, color: colors.gray, marginTop: 2 },
  adminBadge: { backgroundColor: colors.gold, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3 },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: colors.deep },

  tagsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tagOk: { backgroundColor: colors.successBg },
  tagNeutral: { backgroundColor: colors.warnBg },
  tagBlocked: { backgroundColor: colors.errorBg },
  tagText: { fontSize: 10, fontWeight: '600', color: colors.earth },

  selfHint: { fontSize: 11, color: colors.gray, marginTop: 10, fontStyle: 'italic' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: colors.earth },
});
