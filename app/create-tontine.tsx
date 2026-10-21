// app/create-tontine.tsx — Créer une tontine (ou modifier ses paramètres avant démarrage, via ?id=).
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as tontinesApi from '@/src/api/tontines';
import * as billingApi from '@/src/api/billing';
import { ApiError } from '@/src/api/client';
import { colors, fcfa, radius } from '@/src/theme';
import { Button, Card, Field, Loading, PageHeader, Screen, Segmented, SectionTitle, tap } from '@/src/components/ui';

const CYCLES = [
  { value: '7', label: 'Chaque semaine' },
  { value: '14', label: 'Toutes les 2 sem.' },
  { value: '30', label: 'Chaque mois' },
];

const ROTATIONS: { id: tontinesApi.RotationType; label: string; hint: string }[] = [
  { id: 'FIXED_ORDER', label: 'Ordre d’arrivée', hint: 'Le premier inscrit reçoit en premier' },
  { id: 'RANDOM', label: 'Tirage au sort', hint: 'Ordre décidé au hasard' },
  { id: 'GROUP_VOTE', label: 'Vote du groupe', hint: 'Le groupe s’organise ensemble' },
];

export default function CreateTontineScreen() {
  const router = useRouter();
  const { id, draft } = useLocalSearchParams<{ id?: string; draft?: string }>();
  const editingId = id ? Number(id) : null;

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [members, setMembers] = useState('');
  const [cycle, setCycle] = useState('30');
  const [rotation, setRotation] = useState<tontinesApi.RotationType>('FIXED_ORDER');
  const [penalty, setPenalty] = useState('');
  const [wave, setWave] = useState('');
  const [om, setOm] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  // Retour de paiement : on restaure le formulaire saisi avant d'aller payer.
  useEffect(() => {
    if (editingId || !draft) return;
    billingApi.loadDraft<tontinesApi.TontineSettings>().then((d) => {
      if (!d) return;
      setName(d.name);
      setAmount(String(d.cotisationAmount));
      setMembers(String(d.membersRequired));
      if (d.cycleDurationDays) setCycle(String(d.cycleDurationDays));
      if (d.rotationType) setRotation(d.rotationType);
      setPenalty(d.penaltyPerDay ? String(d.penaltyPerDay) : '');
      setWave(d.wavePhone ?? '');
      setOm(d.orangeMoneyPhone ?? '');
      setIsPublic(!!d.makePublic);
    }).catch(() => {});
  }, [draft, editingId]);

  useEffect(() => {
    if (!editingId) return;
    tontinesApi.getDetail(editingId).then((t) => {
      setName(t.name);
      setAmount(String(t.cotisationValue));
      setMembers(String(t.membersRequired));
      setCycle(String(t.cycleDurationDays));
      setRotation(t.rotationType);
      setPenalty(t.penaltyPerDay > 0 ? String(t.penaltyPerDay) : '');
      setWave(t.wavePhone ?? '');
      setOm(t.orangeMoneyPhone ?? '');
      setIsPublic(t.isPublic);
    }).catch((e) => {
      Alert.alert('Chargement impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.', [{ text: 'OK', onPress: () => router.back() }]);
    }).finally(() => setLoading(false));
  }, [editingId]);

  const amountN = Number(amount.replace(/\s/g, ''));
  const membersN = Number(members);
  const pot = Number.isFinite(amountN) && Number.isInteger(membersN) ? amountN * membersN : 0;

  const submit = async () => {
    if (savingRef.current) return;
    if (!name.trim()) return Alert.alert('Nom manquant', 'Donne un nom à ta tontine.');
    if (!Number.isFinite(amountN) || amountN <= 0) return Alert.alert('Montant invalide', 'Indique le montant de la cotisation.');
    if (!Number.isInteger(membersN) || membersN < 2 || membersN > 50) return Alert.alert('Nombre de membres', 'Entre 2 et 50 membres.');
    if (!wave.trim() && !om.trim()) return Alert.alert('Numéro de réception', 'Indique au moins un numéro Wave ou Orange Money pour recevoir les cotisations.');

    savingRef.current = true;
    setSaving(true);
    const payload: tontinesApi.TontineSettings = {
      name: name.trim(),
      cotisationAmount: amountN,
      membersRequired: membersN,
      cycleDurationDays: Number(cycle),
      rotationType: rotation,
      penaltyPerDay: penalty ? Number(penalty) : 0,
      makePublic: isPublic,
      wavePhone: wave.trim() || null,
      orangeMoneyPhone: om.trim() || null,
    };
    try {
      if (editingId) {
        await tontinesApi.update(editingId, payload);
        Alert.alert('Modifications enregistrées', undefined, [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        const q = await billingApi.quote('CREATE');
        if (!q.free && !q.hasCredit) {
          askPayment(payload, q.price);
          return;
        }
        const t = await tontinesApi.create(payload);
        billingApi.clearDraft().catch(() => {});
        router.replace({ pathname: '/tontine/[id]', params: { id: String(t.id) } });
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 402) {
        askPayment(payload, 2500);
        return;
      }
      Alert.alert('Enregistrement impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const askPayment = (payload: tontinesApi.TontineSettings, price: number) => {
    Alert.alert(
      'Nouvelle tontine',
      `Ta première tontine était offerte. Créer une nouvelle tontine coûte ${fcfa(price)} (+ frais du prestataire de paiement), à régler par Wave ou Orange Money. Ton formulaire est conservé.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: `Payer ${fcfa(price)}`, onPress: async () => {
          try {
            await billingApi.saveDraft(payload);
            await billingApi.startCheckout('CREATE');
          } catch (e) {
            Alert.alert('Paiement impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
          }
        } },
      ],
    );
  };

  if (loading) return <Loading />;

  return (
    <Screen>
      <PageHeader back title={editingId ? 'Modifier la tontine' : 'Nouvelle tontine'}
        subtitle={editingId ? 'Possible tant qu’elle n’a pas démarré' : 'Quelques infos et c’est parti'} />

      <Field label="Nom de la tontine" icon="create-outline" placeholder="Ex : Famille Diop 2026" value={name} onChangeText={setName} maxLength={60} />
      <Field label="Cotisation par personne" icon="cash-outline" suffix="FCFA" placeholder="25000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
      <Field label="Nombre de membres (toi compris)" icon="people-outline" placeholder="8" keyboardType="numeric" value={members} onChangeText={setMembers}
        hint="C’est aussi le nombre de tours : chaque membre reçoit le pot une fois." />

      <Text style={s.label}>Fréquence des tours</Text>
      <Segmented value={cycle} onChange={setCycle} options={CYCLES} />

      {pot > 0 && (
        <View style={s.potPreview}>
          <Text style={s.potLabel}>Chaque tour, le bénéficiaire reçoit</Text>
          <Text style={s.potValue}>{fcfa(pot)}</Text>
        </View>
      )}

      <SectionTitle title="Où recevoir les cotisations" />
      <Text style={s.help}>Les membres t’envoient leur cotisation directement. L’app ne touche jamais à l’argent : elle suit qui a payé.</Text>
      <View style={{ height: 12 }} />
      <Field label="Numéro Wave" icon="call-outline" placeholder="77 123 45 67" keyboardType="phone-pad" value={wave} onChangeText={setWave} />
      <Field label="Numéro Orange Money" icon="call-outline" placeholder="77 123 45 67" keyboardType="phone-pad" value={om} onChangeText={setOm} />

      <SectionTitle title="Ordre de passage" />
      <View style={{ gap: 8 }}>
        {ROTATIONS.map((r) => {
          const on = rotation === r.id;
          return (
            <Pressable key={r.id} onPress={() => { tap(); setRotation(r.id); }} style={[s.option, on && s.optionOn]}>
              <View style={[s.radio, on && s.radioOn]}>{on && <View style={s.radioDot} />}</View>
              <View style={{ flex: 1 }}>
                <Text style={s.optionTitle}>{r.label}</Text>
                <Text style={s.optionHint}>{r.hint}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle title="Options" />
      <Field label="Pénalité de retard (facultatif)" icon="alert-circle-outline" suffix="FCFA / jour" placeholder="0" keyboardType="numeric"
        value={penalty} onChangeText={setPenalty} hint="Indicative : l’app calcule le montant, c’est toi qui la réclames." />
      <Card style={s.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>Tontine publique</Text>
          <Text style={s.optionHint}>Visible dans « Découvrir ». Sinon, accessible uniquement par code d’invitation.</Text>
        </View>
        <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.gold, false: colors.border }} thumbColor={colors.white} />
      </Card>

      <Button label={editingId ? 'Enregistrer' : 'Créer la tontine'} onPress={submit} loading={saving} style={{ marginTop: 24 }} />
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 8 },
  help: { fontSize: 13, color: colors.muted, lineHeight: 19 },
  potPreview: { marginTop: 16, backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: 14 },
  potLabel: { fontSize: 12, color: colors.goldDark, fontWeight: '600' },
  potValue: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 2 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1.5, borderColor: colors.border },
  optionOn: { borderColor: colors.ink },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
  optionTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  optionHint: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
