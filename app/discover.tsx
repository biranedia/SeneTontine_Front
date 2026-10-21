// app/discover.tsx — Tontines publiques en recrutement, avec recherche et filtre par montant.
import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as tontinesApi from '@/src/api/tontines';
import { ApiError } from '@/src/api/client';
import { colors } from '@/src/theme';
import { Button, Card, EmptyState, Field, PageHeader, ProgressBar, Screen, Segmented } from '@/src/components/ui';

type Budget = 'all' | 'small' | 'medium' | 'large';
const BUDGETS: { value: Budget; label: string; test: (n: number) => boolean }[] = [
  { value: 'all', label: 'Tous montants', test: () => true },
  { value: 'small', label: '≤ 10 000', test: (n) => n <= 10000 },
  { value: 'medium', label: '10 – 50 000', test: (n) => n > 10000 && n <= 50000 },
  { value: 'large', label: '> 50 000', test: (n) => n > 50000 },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [items, setItems] = useState<tontinesApi.TontineSummary[]>([]);
  const [query, setQuery] = useState('');
  const [budget, setBudget] = useState<Budget>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await tontinesApi.discover());
    } catch {
      // dernières données conservées
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const test = BUDGETS.find((b) => b.value === budget)!.test;
  const visible = items.filter((t) => t.name.toLowerCase().includes(query.trim().toLowerCase()) && test(t.cotisationValue));

  const join = async (t: tontinesApi.TontineSummary) => {
    setJoiningId(t.id);
    try {
      await tontinesApi.join(t.id);
      router.replace({ pathname: '/tontine/[id]', params: { id: String(t.id) } });
    } catch (e) {
      Alert.alert('Impossible de rejoindre', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <PageHeader back title="Découvrir" subtitle="Tontines publiques ouvertes" />
      <Field label="Rechercher" icon="search-outline" placeholder="Nom de la tontine" value={query} onChangeText={setQuery} />
      <View style={{ marginBottom: 16 }}>
        <Segmented value={budget} onChange={setBudget} options={BUDGETS.map(({ value, label }) => ({ value, label }))} />
      </View>

      {!loading && visible.length === 0 ? (
        <EmptyState icon="compass-outline" title="Aucune tontine trouvée"
          text={items.length === 0 ? 'Aucune tontine publique en recrutement pour le moment. Si un proche t’a invité, utilise son code.' : 'Essaie un autre filtre.'} />
      ) : visible.map((t, i) => (
        <Card key={t.id} delay={i} style={{ marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>{t.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{t.name}</Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>{t.cotisation} · {t.tourLabel}</Text>
            </View>
          </View>
          <View style={{ marginVertical: 14 }}><ProgressBar value={t.progress} color={colors.info} /></View>
          <Button small label="Rejoindre" loading={joiningId === t.id} onPress={() => join(t)} />
        </Card>
      ))}
    </Screen>
  );
}
