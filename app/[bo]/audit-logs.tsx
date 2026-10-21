// app/[bo]/audit-logs.tsx — journal des actions sensibles (admin plateforme uniquement)
// Le filtrage par role est fait cote back (AuditLogController) : cet ecran affiche simplement
// ce que l'API renvoie ; un non-admin qui arriverait ici recevrait une erreur 403.
import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius } from '@/src/theme';
import * as auditLogsApi from '@/src/api/auditLogs';
import { ApiError, backofficeKey as bo } from '@/src/api/client';

const ACTION_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  WITHDRAWAL_APPROVED: { label: 'Retrait approuvé', icon: '✅', color: colors.sageLight },
  WITHDRAWAL_REJECTED: { label: 'Retrait rejeté', icon: '⛔', color: colors.error },
  SUPERVISOR_PROMOTED: { label: 'Superviseur promu', icon: '⭐', color: colors.gold },
  SUPERVISOR_REVOKED: { label: 'Superviseur révoqué', icon: '🔻', color: colors.gray },
  USER_BLOCKED: { label: 'Compte bloqué', icon: '🚫', color: colors.error },
  USER_UNBLOCKED: { label: 'Compte débloqué', icon: '✅', color: colors.sageLight },
  USER_ROLE_CHANGED: { label: 'Rôle modifié', icon: '🔄', color: colors.gold },
  INCIDENT_STATUS_CHANGED: { label: 'Signalement traité', icon: '🚨', color: colors.gold },
  TONTINE_STATUS_CHANGED: { label: 'Statut de tontine modifié', icon: '🤝', color: colors.gold },
  MESSAGE_DELETED: { label: 'Message supprimé', icon: '🗑️', color: colors.error },
  ANNOUNCEMENT_BROADCAST: { label: 'Annonce diffusée', icon: '📢', color: colors.gold },
};

export default function AuditLogsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<auditLogsApi.AuditLogInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await auditLogsApi.list());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger le journal.');
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
        <Text style={s.title}>Journal d'audit</Text>
        <Text style={s.subtitle}>{items.length} action{items.length > 1 ? 's' : ''} enregistrée{items.length > 1 ? 's' : ''}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />}
      >
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={{ color: colors.error, textAlign: 'center', marginTop: 40 }}>{error}</Text>
        ) : items.length === 0 ? (
          <Text style={{ color: colors.gray, textAlign: 'center', marginTop: 40 }}>Aucune action enregistrée pour le moment.</Text>
        ) : (
          items.map((entry) => {
            const meta = ACTION_LABEL[entry.action] ?? { label: entry.action, icon: '📝', color: colors.gray };
            return (
              <View key={entry.id} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.actionLabel}>{meta.icon} <Text style={{ color: meta.color }}>{meta.label}</Text></Text>
                  <Text style={s.time}>{new Date(entry.createdAt).toLocaleString('fr-FR')}</Text>
                </View>
                <Text style={s.actor}>Par {entry.actorName}</Text>
                <Text style={s.details}>{entry.details}</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.deep, paddingTop: 54, paddingHorizontal: 24, paddingBottom: 20 },
  back: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  title: { color: colors.cream, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.gray, fontSize: 11, marginTop: 2 },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
  time: { fontSize: 10, color: '#C8B99A' },
  actor: { fontSize: 11, color: colors.gray, marginBottom: 4 },
  details: { fontSize: 12, color: colors.ink, lineHeight: 17 },
});
