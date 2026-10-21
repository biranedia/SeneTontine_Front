// app/[bo]/broadcast.tsx — Annonces à tous les utilisateurs (affichées dans l'appli).
import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as annApi from '@/src/api/announcements';
import { ApiError } from '@/src/api/client';
import { colors } from '@/src/theme';
import { ABtn, ACard, AdminPage, Empty, ErrorBox, Loader, fmtDateTime, st } from '@/src/components/admin/AdminUI';

const MAX = 500;

export default function AdminBroadcastScreen() {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<annApi.AnnouncementInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setHistory(await annApi.history());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les annonces.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = () => {
    const m = message.trim();
    if (m.length < 5) return Alert.alert('Message trop court', 'Écris au moins quelques mots.');
    Alert.alert('Envoyer à tous les utilisateurs ?', m, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Envoyer', onPress: async () => {
        setSending(true);
        try {
          await annApi.broadcast(m);
          setMessage('');
          await load();
          Alert.alert('Annonce envoyée', 'Elle s’affiche maintenant dans l’appli de chaque utilisateur.');
        } catch (e) {
          Alert.alert('Envoi impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
        } finally {
          setSending(false);
        }
      } },
    ]);
  };

  return (
    <AdminPage title="Annonces" subtitle="Un message visible par tous les utilisateurs dans l’appli">
      <ACard style={{ gap: 10, maxWidth: 720 }}>
        <TextInput value={message} onChangeText={(v) => setMessage(v.slice(0, MAX))} multiline
          placeholder="Ex. : Nouveauté ! Vous pouvez maintenant rappeler un membre par WhatsApp en un clic."
          placeholderTextColor={colors.subtle} style={s.input} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={st.meta}>{message.length}/{MAX}</Text>
          <ABtn icon="megaphone-outline" label="Envoyer à tous" tone="primary" busy={sending} onPress={send} />
        </View>
      </ACard>

      <Text style={st.section}>Historique</Text>
      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={load} /> : (
        <ACard style={{ paddingVertical: 4 }}>
          {history.length === 0 ? <Empty text="Aucune annonce envoyée." /> : history.map((a, i) => (
            <View key={a.id} style={[st.row, { alignItems: 'flex-start' }, i === history.length - 1 && st.rowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={s.msg}>{a.message}</Text>
                <Text style={st.meta}>{a.createdByName} · {fmtDateTime(a.createdAt)}</Text>
              </View>
            </View>
          ))}
        </ACard>
      )}
    </AdminPage>
  );
}

const s = StyleSheet.create({
  input: { minHeight: 110, textAlignVertical: 'top', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, fontSize: 15, color: colors.ink },
  msg: { fontSize: 15, lineHeight: 21, color: colors.ink },
});
