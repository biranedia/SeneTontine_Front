// app/[bo]/audit-logs.tsx — Journal des actions sensibles des administrateurs.
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as auditApi from '@/src/api/auditLogs';
import { ApiError } from '@/src/api/client';
import { ACard, AdminPage, Badge, Empty, ErrorBox, Loader, SearchBox, Tone, fmtDateTime, st } from '@/src/components/admin/AdminUI';

const ACTIONS: Record<string, { label: string; tone: Tone }> = {
  USER_BLOCKED: { label: 'Compte bloqué', tone: 'red' },
  USER_UNBLOCKED: { label: 'Compte débloqué', tone: 'green' },
  USER_ROLE_CHANGED: { label: 'Rôle modifié', tone: 'gold' },
  USER_DELETED: { label: 'Compte supprimé', tone: 'red' },
  USER_UPDATED: { label: 'Fiche modifiée', tone: 'blue' },
  PASSWORD_RESET: { label: 'Mot de passe réinitialisé', tone: 'orange' },
  CREDIT_GRANTED: { label: 'Création offerte', tone: 'gold' },
  INCIDENT_STATUS_CHANGED: { label: 'Signalement traité', tone: 'blue' },
  TONTINE_STATUS_CHANGED: { label: 'Tontine modifiée', tone: 'orange' },
  ANNOUNCEMENT_BROADCAST: { label: 'Annonce envoyée', tone: 'blue' },
};

export default function AdminAuditScreen() {
  const [items, setItems] = useState<auditApi.AuditLogInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await auditApi.list());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger le journal.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => !q || a.details?.toLowerCase().includes(q) || a.actorName.toLowerCase().includes(q)
      || (ACTIONS[a.action]?.label ?? a.action).toLowerCase().includes(q));
  }, [items, query]);

  return (
    <AdminPage title="Journal d’audit" subtitle="Chaque action sensible des administrateurs est enregistrée ici"
      onRefresh={() => { setLoading(true); load(); }}>
      <View style={st.toolbar}>
        <SearchBox value={query} onChangeText={setQuery} placeholder="Filtrer par nom, action, détail…" />
      </View>
      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={load} /> : (
        <ACard style={{ paddingVertical: 4 }}>
          {visible.length === 0 ? <Empty text="Aucune action enregistrée." /> : visible.map((a, i) => {
            const meta = ACTIONS[a.action] ?? { label: a.action, tone: 'gray' as Tone };
            return (
              <View key={a.id} style={[st.row, { flexWrap: 'wrap' }, i === visible.length - 1 && st.rowLast]}>
                <Badge label={meta.label} tone={meta.tone} />
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={st.name} numberOfLines={2}>{a.details || `${a.targetType} #${a.targetId}`}</Text>
                  <Text style={st.meta}>par {a.actorName} · {fmtDateTime(a.createdAt)}</Text>
                </View>
              </View>
            );
          })}
        </ACard>
      )}
    </AdminPage>
  );
}
