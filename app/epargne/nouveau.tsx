// app/epargne/nouveau.tsx — Nouvel objectif d'épargne individuelle.
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as savingsApi from '@/src/api/savings';
import { ApiError } from '@/src/api/client';
import { colors, fcfa, radius } from '@/src/theme';
import { Button, Card, Field, PageHeader, Screen, Segmented, tap } from '@/src/components/ui';

const EMOJIS = ['🎯', '🐑', '🏠', '🎓', '✈️', '💍', '🚗', '📱', '🏥', '🕋'];
const CYCLES = [
  { value: '7', label: 'Chaque semaine' },
  { value: '14', label: 'Toutes les 2 sem.' },
  { value: '30', label: 'Chaque mois' },
];

export default function NewGoalScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [target, setTarget] = useState('');
  const [planned, setPlanned] = useState(true);
  const [periodic, setPeriodic] = useState('');
  const [cycle, setCycle] = useState('30');
  const [saving, setSaving] = useState(false);

  const targetN = Number(target.replace(/\s/g, ''));
  const periodicN = Number(periodic.replace(/\s/g, ''));
  const steps = planned && targetN > 0 && periodicN > 0 ? Math.ceil(targetN / periodicN) : 0;

  const submit = async () => {
    if (!name.trim()) return Alert.alert('Nom manquant', 'Donne un nom à ton objectif.');
    if (!(targetN > 0)) return Alert.alert('Montant invalide', 'Indique le montant à atteindre.');
    if (planned && !(periodicN > 0)) return Alert.alert('Versement', 'Indique combien tu mets de côté à chaque fois.');
    setSaving(true);
    try {
      const g = await savingsApi.create({
        name: name.trim(), emoji, targetAmount: targetN,
        periodicAmount: planned ? periodicN : null,
        cycleDays: planned ? Number(cycle) : null,
      });
      router.replace({ pathname: '/epargne/[id]', params: { id: String(g.id) } });
    } catch (e) {
      Alert.alert('Création impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <PageHeader back title="Nouvel objectif" subtitle="Épargne personnelle, gratuite" />
      <Text style={s.label}>Icône</Text>
      <View style={s.emojis}>
        {EMOJIS.map((e) => (
          <Pressable key={e} onPress={() => { tap(); setEmoji(e); }} style={[s.emoji, emoji === e && s.emojiOn]}>
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Nom de l'objectif" icon="create-outline" placeholder="Ex : Mouton de Tabaski" value={name} onChangeText={setName} maxLength={80} />
      <Field label="Montant à atteindre" icon="flag-outline" suffix="FCFA" placeholder="150000" keyboardType="numeric" value={target} onChangeText={setTarget} />

      <Card style={s.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Versements réguliers</Text>
          <Text style={s.hint}>Je reçois un rappel la veille de chaque versement.</Text>
        </View>
        <Switch value={planned} onValueChange={setPlanned} trackColor={{ true: colors.gold, false: colors.border }} thumbColor={colors.white} />
      </Card>

      {planned && (
        <View style={{ marginTop: 16 }}>
          <Field label="Je mets de côté" icon="cash-outline" suffix="FCFA" placeholder="10000" keyboardType="numeric" value={periodic} onChangeText={setPeriodic} />
          <Segmented value={cycle} onChange={setCycle} options={CYCLES} />
          {steps > 0 && (
            <View style={s.preview}>
              <Text style={s.previewText}>
                Objectif atteint en {steps} versement{steps > 1 ? 's' : ''} de {fcfa(periodicN)}
              </Text>
            </View>
          )}
        </View>
      )}

      <Button label="Créer l'objectif" onPress={submit} loading={saving} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 8 },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  emoji: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  emojiOn: { borderColor: colors.ink, backgroundColor: colors.goldSoft },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  preview: { marginTop: 14, backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: 12 },
  previewText: { fontSize: 13, fontWeight: '600', color: colors.goldDark },
});
