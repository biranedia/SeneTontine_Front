// app/login.tsx — Connexion
import { InstallApp } from '@/src/components/InstallApp';
import React, { useRef, useState } from 'react';
import { Alert, Image, Linking, StyleSheet, Text, View } from 'react-native';
import { useT } from '@/src/i18n';
import { SUPPORT_WHATSAPP, whatsappUrl } from '@/src/config';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ApiError } from '@/src/api/client';
import { colors } from '@/src/theme';
import { Button, Field, Screen } from '@/src/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useT();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const submit = async () => {
    if (busy.current) return;
    if (!phone.trim() || !password) return Alert.alert(t('Champs manquants'), 'Entre ton numéro et ton mot de passe.');
    busy.current = true;
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (e) {
      Alert.alert(t('Connexion impossible'), e instanceof ApiError ? e.message : t('Réessaie plus tard.'));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={s.brand}>
        <Image source={require('../assets/logo.png')} style={s.logo} />
        <Text style={s.title}>SèneTontine</Text>
        <Text style={s.tagline}>{t('Vos tontines, simples et transparentes.')}</Text>
      </View>

      <Text style={s.h}>{t('Connexion')}</Text>
      <Field label={t('Numéro de téléphone')} icon="call-outline" placeholder="77 123 45 67" keyboardType="phone-pad"
        value={phone} onChangeText={setPhone} autoComplete="tel" />
      <Field label={t('Mot de passe')} icon="lock-closed-outline" placeholder="••••••••" secureTextEntry
        value={password} onChangeText={setPassword} onSubmitEditing={submit} />

      <Text style={s.forgot} onPress={() => Linking.openURL(whatsappUrl(
        `Bonjour SèneTontine, j'ai oublié mon mot de passe. Mon numéro de compte : ${phone.trim() || '…'}`, SUPPORT_WHATSAPP))}>
        {t('Mot de passe oublié ?')}
      </Text>

      <Button label={t('Se connecter')} onPress={submit} loading={loading} />
      <View style={s.footer}>
        <Text style={s.footerText}>{t('Pas encore de compte ?')}</Text>
        <Button label={t('Créer un compte')} variant="secondary" onPress={() => router.push('/register')} style={{ marginTop: 10 }} />
        <InstallApp />
        <Text style={[s.forgot, { alignSelf: 'center', marginTop: 20 }]} onPress={() => router.replace('/')}>{t('Découvrir SèneTontine')}</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  brand: { alignItems: 'center', marginTop: 32, marginBottom: 36 },
  logo: { width: 72, height: 72, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink, marginTop: 14, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: colors.muted, marginTop: 6 },
  h: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 16 },
  forgot: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 16, fontSize: 13, fontWeight: '700', color: colors.goldDark },
  footer: { marginTop: 32, alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.muted },
});
