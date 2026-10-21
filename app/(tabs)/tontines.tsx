// app/(tabs)/tontines.tsx — Tontines de groupe et épargne personnelle.
import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as tontinesApi from '@/src/api/tontines';
import * as savingsApi from '@/src/api/savings';
import { Button, EmptyState, PageHeader, Screen, Segmented } from '@/src/components/ui';
import TontineCard from '@/src/components/TontineCard';
import GoalCard from '@/src/components/GoalCard';

type Mode = 'groups' | 'savings';
type Filter = 'all' | 'ACTIVE' | 'PENDING' | 'DONE';

export default function TontinesScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('groups');
  const [items, setItems] = useState<tontinesApi.TontineSummary[]>([]);
  const [goals, setGoals] = useState<savingsApi.GoalSummary[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, g] = await Promise.all([tontinesApi.listMine(), savingsApi.list().catch(() => [])]);
      setItems(t);
      setGoals(g);
    } catch {
      // dernières données conservées
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const visible = items.filter((t) =>
    filter === 'all' ? true
      : filter === 'DONE' ? t.status === 'COMPLETED' || t.status === 'CANCELLED'
      : t.status === filter);

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <PageHeader title="Mes tontines" />
      <View style={{ marginBottom: 16 }}>
        <Segmented<Mode> value={mode} onChange={setMode}
          options={[{ value: 'groups', label: `En groupe (${items.length})` }, { value: 'savings', label: `Épargne perso (${goals.length})` }]} />
      </View>

      {mode === 'groups' ? (
        <>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <Button label="Créer" icon="add" onPress={() => router.push('/create-tontine')} style={{ flex: 1 }} />
            <Button label="Rejoindre" icon="key-outline" variant="secondary" onPress={() => router.push('/join')} style={{ flex: 1 }} />
          </View>
          <View style={{ marginBottom: 16 }}>
            <Segmented<Filter> value={filter} onChange={setFilter} options={[
              { value: 'all', label: 'Toutes' },
              { value: 'ACTIVE', label: 'En cours' },
              { value: 'PENDING', label: 'Recrutement' },
              { value: 'DONE', label: 'Terminées' },
            ]} />
          </View>
          {!loading && visible.length === 0 ? (
            <EmptyState icon="file-tray-outline"
              title={items.length === 0 ? 'Aucune tontine pour le moment' : 'Rien dans cette catégorie'}
              text={items.length === 0 ? 'Crée la tienne ou découvre des tontines publiques ouvertes.' : undefined}
              action={items.length === 0 ? 'Découvrir des tontines' : undefined}
              onAction={() => router.push('/discover')} />
          ) : visible.map((t, i) => <TontineCard key={t.id} t={t} index={i} />)}
        </>
      ) : (
        <>
          <Button label="Nouvel objectif d'épargne" icon="add" onPress={() => router.push('/epargne/nouveau')} style={{ marginBottom: 16 }} />
          {!loading && goals.length === 0 ? (
            <EmptyState icon="wallet-outline" title="Épargne seul, à ton rythme"
              text="Fixe un objectif (Tabaski, rentrée, voyage…), enregistre ce que tu mets de côté et reçois un rappel à chaque échéance. Gratuit." />
          ) : goals.map((g, i) => <GoalCard key={g.id} g={g} index={i} />)}
        </>
      )}
    </Screen>
  );
}
