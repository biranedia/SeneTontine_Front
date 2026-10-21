// app/admin/broadcast.tsx — Diffusion d'une annonce a tous les utilisateurs (admin uniquement)
// Pas de vrai push notification (infrastructure absente) : l'annonce la plus recente s'affiche
// en banniere sur le tableau de bord de chaque utilisateur au prochain chargement (voir
// dashboard.tsx). Suffisant pour des annonces informatives (maintenance, nouveaute...).
import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors, radius, shadow } from '@/src/theme';
import * as announcementsApi from '@/src/api/announcements';
import { ApiError } from '@/src/api/client';

export default function AdminBroadcastScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [history, setHistory] = useState<announcementsApi.AnnouncementInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setHistory(await announcementsApi.history());
    } catch {
      // l'historique reste vide si l'appel echoue, le formulaire d'envoi reste utilisable
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const canSend = message.trim().length >= 5 && !sending;

  const onSend = async () => {
    if (!canSend || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const created = await announcementsApi.broadcast(message.trim());
      setHistory((prev) => [created, ...prev]);
      setMessage('');
      Alert.alert('Annonce diffusée ✅', 'Tous les utilisateurs la verront sur leur tableau de bord.');
    } catch (e) {
      Alert.alert('Envoi impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.deep} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.title}>Diffuser une annonce 📢</Text>
        <Text style={s.subtitle}>Visible par tous les utilisateurs sur leur tableau de bord.</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <TextInput
          style={s.textarea}
          placeholder="Ex : Maintenance prévue dimanche de 2h à 4h du matin..."
          placeholderTextColor="#C8B99A"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text style={s.counter}>{message.trim().length}/1000 (5 caractères minimum)</Text>

        <TouchableOpacity style={[s.sendBtn, !canSend && { opacity: 0.5 }]} onPress={onSend} disabled={!canSend}>
          {sending ? <ActivityIndicator color={colors.deep} /> : <Text style={s.sendBtnText}>Diffuser à tous les utilisateurs</Text>}
        </TouchableOpacity>

        <Text style={s.sectionTitle}>Annonces précédentes</Text>
        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginTop: 10 }} />
        ) : history.length === 0 ? (
          <Text style={s.emptyText}>Aucune annonce diffusée pour l'instant.</Text>
        ) : (
          history.map((a) => (
            <View key={a.id} style={s.card}>
              <Text style={s.cardText}>{a.message}</Text>
              <Text style={s.cardMeta}>Par {a.createdByName} · {new Date(a.createdAt).toLocaleString('fr-FR')}</Text>
            </View>
          ))
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
  subtitle: { color: colors.gray, fontSize: 12, marginTop: 6, lineHeight: 17 },

  textarea: {
    backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: colors.ink, minHeight: 90, marginBottom: 4,
  },
  counter: { fontSize: 10, color: colors.gray, textAlign: 'right', marginBottom: 16 },

  sendBtn: { backgroundColor: colors.gold, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginBottom: 24 },
  sendBtnText: { color: colors.deep, fontWeight: '700', fontSize: 14 },

  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.earth, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  emptyText: { color: colors.gray, fontSize: 12 },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border, ...shadow.soft },
  cardText: { fontSize: 13, color: colors.ink, lineHeight: 18, marginBottom: 6 },
  cardMeta: { fontSize: 10, color: colors.gray },
});
