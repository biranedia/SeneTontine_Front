// app/epargne/[id].tsx — Suivi d'un objectif d'épargne : progression, versements, retraits.
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as savingsApi from '@/src/api/savings';
import { ApiError } from '@/src/api/client';
import { colors, fcfa, radius } from '@/src/theme';
import { Button, Card, EmptyState, Field, Loading, PageHeader, ProgressBar, Screen, SectionTitle } from '@/src/components/ui';

export default function GoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);
  const [data, setData] = useState<savingsApi.GoalDetail | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [entryType, setEntryType] = useState<savingsApi.EntryInfo['type'] | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await savingsApi.detail(goalId));
    } catch (e) {
      Alert.alert('Chargement impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setRefreshing(false);
    }
  }, [goalId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!data) return <Loading />;
  const g = data.goal;
  const remaining = Math.max(0, g.targetAmount - g.savedAmount);
  const nextDue = g.nextDueDate ? new Date(g.nextDueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : null;

  const confirmDelete = () => Alert.alert('Supprimer cet objectif ?', 'Son historique sera effacé.', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: async () => {
      try { await savingsApi.remove(goalId); router.back(); }
      catch (e) { Alert.alert('Échec', e instanceof ApiError ? e.message : 'Réessaie plus tard.'); }
    } },
  ]);

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <PageHeader back title={`${g.emoji} ${g.name}`} subtitle="Épargne personnelle"
        right={<Pressable onPress={confirmDelete} hitSlop={10}><Ionicons name="trash-outline" size={20} color={colors.muted} /></Pressable>} />

      <View style={s.hero}>
        <Text style={s.heroLabel}>{g.completed ? 'OBJECTIF ATTEINT 🎉' : 'DÉJÀ ÉPARGNÉ'}</Text>
        <Text style={s.heroAmount}>{fcfa(g.savedAmount)}</Text>
        <Text style={s.heroSub}>sur {fcfa(g.targetAmount)} · {Math.round(g.progress * 100)} %</Text>
        <View style={{ marginTop: 16 }}><ProgressBar value={g.progress} color={colors.goldLight} track="#3A352D" /></View>
        {!g.completed && (
          <Text style={s.heroInfo}>
            Encore {fcfa(remaining)}{g.periodicAmount && nextDue ? ` · prochain versement de ${fcfa(g.periodicAmount)} le ${nextDue}` : ''}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Button label="J'ai épargné" icon="add" onPress={() => setEntryType('DEPOSIT')} style={{ flex: 1 }} />
        <Button label="Retrait" icon="remove" variant="secondary" onPress={() => setEntryType('WITHDRAWAL')} style={{ flex: 1 }} disabled={g.savedAmount <= 0} />
      </View>

      <SectionTitle title="Historique" />
      {data.entries.length === 0 ? (
        <EmptyState icon="wallet-outline" title="Aucun versement pour l'instant" text="Enregistre chaque somme mise de côté pour suivre ta progression." />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {data.entries.map((e, i) => (
            <View key={e.id} style={[s.row, i < data.entries.length - 1 && s.rowLine]}>
              <View style={[s.dot, { backgroundColor: e.type === 'DEPOSIT' ? colors.successSoft : colors.dangerSoft }]}>
                <Ionicons name={e.type === 'DEPOSIT' ? 'arrow-down' : 'arrow-up'} size={16} color={e.type === 'DEPOSIT' ? colors.success : colors.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{e.note || (e.type === 'DEPOSIT' ? 'Versement' : 'Retrait')}</Text>
                <Text style={s.rowSub}>{new Date(e.createdAt).toLocaleDateString('fr-FR')}</Text>
              </View>
              <Text style={[s.rowAmount, { color: e.type === 'DEPOSIT' ? colors.success : colors.danger }]}>
                {e.type === 'DEPOSIT' ? '+' : '−'}{fcfa(e.amount)}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <EntrySheet type={entryType} suggested={g.periodicAmount} onClose={() => setEntryType(null)}
        onSubmit={async (amount, note) => {
          const d = await savingsApi.addEntry(goalId, entryType!, amount, note);
          setData(d);
          setEntryType(null);
        }} />
    </Screen>
  );
}

function EntrySheet({ type, suggested, onClose, onSubmit }: {
  type: savingsApi.EntryInfo['type'] | null; suggested: number | null;
  onClose: () => void; onSubmit: (amount: number, note?: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const n = Number((amount || (type === 'DEPOSIT' && suggested ? String(suggested) : '')).replace(/\s/g, ''));

  const submit = async () => {
    if (!(n > 0)) return Alert.alert('Montant invalide', 'Indique un montant.');
    setLoading(true);
    try {
      await onSubmit(n, note.trim() || undefined);
      setAmount(''); setNote('');
    } catch (e) {
      Alert.alert('Échec', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={type !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <Text style={s.sheetTitle}>{type === 'DEPOSIT' ? 'Ajouter un versement' : 'Enregistrer un retrait'}</Text>
        <View style={{ height: 16 }} />
        <Field label="Montant" icon="cash-outline" suffix="FCFA" keyboardType="numeric"
          placeholder={type === 'DEPOSIT' && suggested ? String(suggested) : '0'} value={amount} onChangeText={setAmount} />
        <Field label="Note (facultatif)" icon="create-outline" placeholder="Ex : Salaire d'octobre" value={note} onChangeText={setNote} maxLength={120} />
        <Button label="Enregistrer" onPress={submit} loading={loading} />
        <Button label="Annuler" variant="ghost" onPress={onClose} style={{ marginTop: 4 }} />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 22 },
  heroLabel: { color: colors.goldLight, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroAmount: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 8 },
  heroSub: { color: '#BDB5A8', fontSize: 13, marginTop: 4 },
  heroInfo: { color: '#D9D2C5', fontSize: 13, marginTop: 14, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '800' },
  backdrop: { flex: 1, backgroundColor: 'rgba(28,26,23,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
});
