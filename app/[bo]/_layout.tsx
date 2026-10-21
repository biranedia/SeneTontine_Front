// app/[bo]/_layout.tsx — Espace admin caché : n'existe qu'à l'adresse secrète /<ADMIN_PATH>/...
// Le 1er segment de l'URL sert de clé (en-tête X-Backoffice). Mauvaise clé, compte non admin,
// ou n'importe quelle autre adresse : « Page introuvable », sans rien révéler.
import React, { useEffect, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { setBackofficeKey } from '@/src/api/client';
import * as adminApi from '@/src/api/admin';
import { useAuth } from '@/src/context/AuthContext';
import { Loading } from '@/src/components/ui';
import { colors } from '@/src/theme';

export default function BackofficeLayout() {
  const { bo } = useLocalSearchParams<{ bo: string }>();
  const { user } = useAuth();
  const [state, setState] = useState<'checking' | 'ok' | 'nope'>('checking');

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
      document.title = 'SèneTontine';
    }
  }, []);

  useEffect(() => {
    const key = String(bo ?? '');
    // On ne se fie pas au rôle gardé en mémoire sur le téléphone (il peut dater d'avant la
    // promotion en admin) : c'est le serveur qui tranche.
    if (!user || !/^[A-Za-z0-9_-]{4,64}$/.test(key)) { setState('nope'); return; }
    setBackofficeKey(key);
    adminApi.overview().then(() => setState('ok')).catch(() => { setBackofficeKey(''); setState('nope'); });
  }, [bo, user?.phone]);

  if (state === 'checking') return <Loading />;
  if (state === 'nope') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>Page introuvable</Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>Cette adresse n’existe pas.</Text>
      </View>
    );
  }
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />;
}
