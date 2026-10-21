// app/join.tsx — Rejoindre une tontine avec le code reçu (WhatsApp, SMS...).
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as tontinesApi from '@/src/api/tontines';
import { ApiError } from '@/src/api/client';
import { colors, radius } from '@/src/theme';
import { Button, PageHeader, Screen } from '@/src/components/ui';

export default function JoinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(typeof params.code === 'string' ? params.code.toUpperCase() : '');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const t = await tontinesApi.joinByCode(code.trim());
      router.replace({ pathname: '/tontine/[id]', params: { id: String(t.id) } });
    } catch (e) {
      Alert.alert('Code refusé', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <PageHeader back title="Rejoindre une tontine" />
      <View style={s.icon}><Ionicons name="key-outline" size={30} color={colors.goldDark} /></View>
      <Text style={s.text}>Entre le code d’invitation que le créateur t’a partagé.</Text>
      <TextInput
        style={s.input}
        value={code}
        onChangeText={(v) => setCode(v.toUpperCase())}
        placeholder="ABCD2345"
        placeholderTextColor={colors.subtle}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={8}
        autoFocus
      />
      <Button label="Rejoindre" onPress={submit} loading={loading} disabled={code.trim().length < 4} />
    </Screen>
  );
}

const s = StyleSheet.create({
  icon: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  text: { textAlign: 'center', fontSize: 15, color: colors.muted, marginTop: 16, marginBottom: 24, lineHeight: 22 },
  input: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 18, textAlign: 'center', fontSize: 28, fontWeight: '800', letterSpacing: 6, color: colors.ink, marginBottom: 20 },
});
