// app/[bo]/_layout.tsx — Espace admin caché : n'existe qu'à l'adresse secrète /<ADMIN_PATH>/...
// Le 1er segment de l'URL sert de clé (en-tête X-Backoffice). Mauvaise clé, compte non admin,
// ou n'importe quelle autre adresse : « Page introuvable », sans rien révéler.
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ApiError, setBackofficeKey } from '@/src/api/client';
import * as adminApi from '@/src/api/admin';
import { useAuth } from '@/src/context/AuthContext';
import { Loading } from '@/src/components/ui';
import { AdminShell } from '@/src/components/admin/AdminUI';
import { colors } from '@/src/theme';

export default function BackofficeLayout() {
  const { bo } = useLocalSearchParams<{ bo: string }>();
  const { user } = useAuth();
  const router = useRouter();
  // checking : vérification ; ok : accès ; waking : serveur injoignable (démarrage, réseau) ;
  // login : session expirée ; nope : mauvaise clé ou compte non admin.
  const [state, setState] = useState<'checking' | 'ok' | 'waking' | 'login' | 'nope'>('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let m = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (!m) { m = document.createElement('meta'); m.name = 'robots'; document.head.appendChild(m); }
      m.content = 'noindex, nofollow';
      document.title = 'SèneTontine';
    }
  }, []);

  useEffect(() => {
    // Clé lue dans l'adresse réelle : sur la page générée à l'avance, le paramètre vaut « [bo] ».
    const fromUrl = Platform.OS === 'web' && typeof window !== 'undefined'
      ? decodeURIComponent(window.location.pathname.split('/').filter(Boolean)[0] ?? '') : '';
    const key = fromUrl && fromUrl !== '[bo]' ? fromUrl : String(bo ?? '');
    // On ne se fie pas au rôle gardé en mémoire sur le téléphone (il peut dater d'avant la
    // promotion en admin) : c'est le serveur qui tranche.
    if (!/^[A-Za-z0-9_-]{4,64}$/.test(key)) { setState('nope'); return; }
    if (!user) { setState('login'); return; }
    setBackofficeKey(key);
    setState('checking');
    let cancelled = false;
    // Le serveur gratuit peut mettre jusqu'à une minute à se réveiller : on réessaie avant de
    // conclure, et on ne dit « introuvable » que si le serveur répond vraiment non (403/404).
    const tryOnce = async (n: number): Promise<void> => {
      try {
        await adminApi.overview();
        if (!cancelled) setState('ok');
      } catch (e) {
        if (cancelled) return;
        const status = e instanceof ApiError ? e.status : 0;
        if (status === 404 || status === 403) { setBackofficeKey(''); setState('nope'); return; }
        if (status === 401) { setState('login'); return; }
        if (n < 4) { setState('waking'); setTimeout(() => tryOnce(n + 1), 4000 * (n + 1)); return; }
        setState('waking');
      }
    };
    tryOnce(0);
    return () => { cancelled = true; };
  }, [bo, user?.phone, attempt]);

  if (state === 'checking') return <Loading />;
  if (state === 'waking' || state === 'login') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24, gap: 12 }}>
        {state === 'waking' && <ActivityIndicator color={colors.goldDark} />}
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, textAlign: 'center' }}>
          {state === 'waking' ? 'Connexion au serveur…' : 'Connecte-toi pour continuer'}
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center', maxWidth: 360 }}>
          {state === 'waking'
            ? 'Le serveur se réveille, ça peut prendre jusqu’à une minute. Vérifie aussi ta connexion internet.'
            : 'Ta session a expiré sur cet appareil.'}
        </Text>
        <Pressable onPress={() => (state === 'waking' ? setAttempt((a) => a + 1) : router.replace('/login' as any))}
          style={{ backgroundColor: colors.ink, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12, marginTop: 6 }}>
          <Text style={{ color: colors.white, fontWeight: '700' }}>{state === 'waking' ? 'Réessayer' : 'Se connecter'}</Text>
        </Pressable>
      </View>
    );
  }
  if (state === 'nope') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink }}>Page introuvable</Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginTop: 6 }}>Cette adresse n’existe pas.</Text>
      </View>
    );
  }
  return (
    <AdminShell>
      <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.bg } }} />
    </AdminShell>
  );
}
