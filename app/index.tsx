// app/index.tsx — Connexion
import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { ApiError } from '@/src/api/client';
import { colors } from '@/src/theme';
import { Button, Field, Screen } from '@/src/components/ui';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const submit = async () => {
    if (busy.current) return;
    if (!phone.trim() || !password) return Alert.alert('Champs manquants', 'Entre ton numéro et ton mot de passe.');
    busy.current = true;
    setLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (e) {
      Alert.alert('Connexion impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
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
        <Text style={s.tagline}>Vos tontines, simples et transparentes.</Text>
      </View>

      <Text style={s.h}>Connexion</Text>
      <Field label="Numéro de téléphone" icon="call-outline" placeholder="77 123 45 67" keyboardType="phone-pad"
        value={phone} onChangeText={setPhone} autoComplete="tel" />
      <Field label="Mot de passe" icon="lock-closed-outline" placeholder="••••••••" secureTextEntry={!showPwd}
        value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      <Button label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} variant="ghost" small onPress={() => setShowPwd((v) => !v)} style={{ alignSelf: 'flex-start', marginTop: -8, marginBottom: 8 }} />

      <Button label="Se connecter" onPress={submit} loading={loading} />
      <View style={s.footer}>
        <Text style={s.footerText}>Pas encore de compte ?</Text>
        <Button label="Créer un compte" variant="secondary" onPress={() => router.push('/register')} style={{ marginTop: 10 }} />
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
  footer: { marginTop: 32, alignItems: 'center' },
  footerText: { fontSize: 14, color: colors.muted },
});
