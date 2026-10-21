// app/[bo]/incidents.tsx — Signalements des membres : tri par statut, traitement avec note.
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as incidentsApi from '@/src/api/incidents';
import { ApiError } from '@/src/api/client';
import { colors } from '@/src/theme';
import { ABtn, ACard, AdminPage, Badge, Chips, Empty, ErrorBox, Loader, fmtDateTime, st } from '@/src/components/admin/AdminUI';

type Filter = 'ALL' | incidentsApi.IncidentStatus;
const STATUS: Record<incidentsApi.IncidentStatus, { label: string; tone: 'orange' | 'blue' | 'green' | 'gray' }> = {
  OPEN: { label: 'Ouvert', tone: 'orange' }, IN_PROGRESS: { label: 'En cours', tone: 'blue' },
  RESOLVED: { label: 'Résolu', tone: 'green' }, DISMISSED: { label: 'Rejeté', tone: 'gray' },
};
const CAT: Record<incidentsApi.IncidentCategory, string> = {
  FRAUD: 'Fraude', PAYMENT_ISSUE: 'Problème de paiement', HARASSMENT: 'Harcèlement', TECHNICAL_BUG: 'Bug technique', OTHER: 'Autre',
};

export default function AdminIncidentsScreen() {
  const [items, setItems] = useState<incidentsApi.IncidentInfo[]>([]);
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async (f: Filter) => {
    try {
      setError(null);
      setItems(await incidentsApi.listAll(f === 'ALL' ? undefined : f));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les signalements.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(filter); }, [load, filter]));

  const resolve = async (i: incidentsApi.IncidentInfo, status: 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED') => {
    setBusy(i.id);
    try {
      await incidentsApi.resolve(i.id, status, notes[i.id]?.trim() || undefined);
      await load(filter);
    } catch (e) {
      Alert.alert('Action impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <AdminPage title="Signalements" subtitle="Problèmes remontés par les membres" onRefresh={() => { setLoading(true); load(filter); }}>
      <View style={{ marginBottom: 14 }}>
        <Chips value={filter} onChange={(f) => { setLoading(true); setFilter(f); }} options={[
          { value: 'OPEN', label: 'Ouverts' }, { value: 'IN_PROGRESS', label: 'En cours' },
          { value: 'RESOLVED', label: 'Résolus' }, { value: 'DISMISSED', label: 'Rejetés' }, { value: 'ALL', label: 'Tous' },
        ]} />
      </View>
      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={() => load(filter)} /> : items.length === 0 ? (
        <ACard><Empty text="Aucun signalement ici. 🎉" /></ACard>
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((i) => (
            <ACard key={i.id} style={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge label={STATUS[i.status].label} tone={STATUS[i.status].tone} />
                <Badge label={CAT[i.category]} tone="red" />
                <Text style={[st.meta, { marginTop: 0 }]}>par {i.reporterName} · {fmtDateTime(i.createdAt)}</Text>
              </View>
              <Text style={s.desc}>{i.description}</Text>
              {i.targetType && <Text style={st.meta}>Concerne : {i.targetType} #{i.targetId}</Text>}
              {i.adminNote && <Text style={s.note}>Note : {i.adminNote}{i.resolvedByName ? ` — ${i.resolvedByName}` : ''}</Text>}
              {(i.status === 'OPEN' || i.status === 'IN_PROGRESS') && (
                <>
                  <TextInput placeholder="Note pour le suivi (facultatif)" placeholderTextColor={colors.subtle}
                    value={notes[i.id] ?? ''} onChangeText={(v) => setNotes((n) => ({ ...n, [i.id]: v }))} style={s.input} />
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {i.status === 'OPEN' && <ABtn icon="time-outline" label="Prendre en charge" busy={busy === i.id} onPress={() => resolve(i, 'IN_PROGRESS')} />}
                    <ABtn icon="checkmark-circle-outline" label="Résolu" tone="success" busy={busy === i.id} onPress={() => resolve(i, 'RESOLVED')} />
                    <ABtn icon="close-circle-outline" label="Rejeter" tone="danger" busy={busy === i.id} onPress={() => resolve(i, 'DISMISSED')} />
                  </View>
                </>
              )}
            </ACard>
          ))}
        </View>
      )}
    </AdminPage>
  );
}

const s = StyleSheet.create({
  desc: { fontSize: 15, lineHeight: 22, color: colors.ink },
  note: { fontSize: 13, color: colors.muted, fontStyle: 'italic' },
  input: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink },
});
