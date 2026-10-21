// app/report-incident.tsx — Signalement d'incident (fraude, litige, comportement abusif, bug)
// Ouvert a tout utilisateur connecte, meme non verifie KYC (voir IncidentController) : un
// probleme sur son propre compte doit pouvoir etre signale avant meme d'etre verifie.
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius } from '@/src/theme';
import * as incidentsApi from '@/src/api/incidents';
import { ApiError } from '@/src/api/client';

const CATEGORIES: { id: incidentsApi.IncidentCategory; icon: string; label: string }[] = [
  { id: 'FRAUD', icon: '🚨', label: 'Fraude suspectée' },
  { id: 'PAYMENT_ISSUE', icon: '💳', label: 'Litige de paiement' },
  { id: 'HARASSMENT', icon: '⚠️', label: 'Comportement abusif' },
  { id: 'TECHNICAL_BUG', icon: '🐛', label: 'Bug technique' },
  { id: 'OTHER', icon: '📝', label: 'Autre' },
];

export default function ReportIncidentScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<incidentsApi.IncidentCategory>('FRAUD');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // Meme garde synchrone que sur les autres actions sensibles de l'app (paiement, KYC,
  // creation de tontine) : evite qu'un double-tap cree deux signalements identiques.
  const submittingRef = useRef(false);

  const canSubmit = description.trim().length >= 10 && !submitting;

  const onSubmit = async () => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await incidentsApi.submit(category, description.trim());
      Alert.alert(
        'Signalement envoyé ✅',
        "Un administrateur va l'examiner. Tu peux suivre son statut depuis \"Mes signalements\".",
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert('Envoi impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deep} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Signaler un problème 🚨</Text>
        <Text style={s.subtitle}>Un admin de la plateforme examinera ton signalement rapidement.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={s.fieldLabel}>Type de problème</Text>
        <View style={s.grid}>
          {CATEGORIES.map((c) => {
            const sel = category === c.id;
            return (
              <TouchableOpacity key={c.id} style={[s.catOpt, sel && s.catOptSel]} onPress={() => setCategory(c.id)}>
                <Text style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</Text>
                <Text style={[s.catText, sel && { color: colors.ink }]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.fieldLabel}>Décris ce qui s'est passé</Text>
        <TextInput
          style={s.textarea}
          placeholder="Sois aussi précis que possible : quand, avec qui/quelle tontine, ce que tu as constaté..."
          placeholderTextColor="#C8B99A"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={6}
          maxLength={2000}
          textAlignVertical="top"
        />
        <Text style={s.counter}>{description.trim().length}/2000 (10 caractères minimum)</Text>

        <TouchableOpacity style={[s.submitBtn, !canSubmit && { opacity: 0.5 }]} onPress={onSubmit} disabled={!canSubmit}>
          {submitting ? <ActivityIndicator color={colors.deep} /> : <Text style={s.submitBtnText}>Envoyer le signalement</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.deep, paddingTop: 54, paddingHorizontal: 24, paddingBottom: 20 },
  back: { color: colors.gold, fontSize: 13, fontWeight: '500' },
  title: { color: colors.cream, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 6, lineHeight: 17 },

  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.earth, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  catOpt: { width: '31%', padding: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.white },
  catOptSel: { borderColor: colors.gold, backgroundColor: colors.goldPale },
  catText: { fontSize: 10, fontWeight: '500', color: colors.earth, textAlign: 'center' },

  textarea: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: colors.ink, minHeight: 120, marginBottom: 4,
  },
  counter: { fontSize: 10, color: colors.gray, textAlign: 'right', marginBottom: 16 },

  submitBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 30 },
  submitBtnText: { color: colors.deep, fontWeight: '600', fontSize: 15 },
});
