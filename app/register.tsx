// app/register.tsx — Inscription (téléphone + mot de passe, consentement aux CGU).
import React, { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/context/AuthContext';
import { ApiError } from '@/src/api/client';
import { colors } from '@/src/theme';
import { Button, Field, PageHeader, Screen, tap } from '@/src/components/ui';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useT();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const busy = useRef(false);

  const submit = async () => {
    if (busy.current) return;
    if (!fullName.trim() || !phone.trim() || !password) return Alert.alert('Champs manquants', 'Nom, téléphone et mot de passe sont obligatoires.');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return Alert.alert('Mot de passe trop faible', 'Au moins 8 caractères, avec une lettre et un chiffre.');
    }
    if (password !== confirm) return Alert.alert('Mots de passe différents', 'Les deux mots de passe ne correspondent pas.');
    if (!accepted) return Alert.alert('Conditions', 'Accepte les conditions d’utilisation pour continuer.');
    busy.current = true;
    setLoading(true);
    try {
      await register(fullName.trim(), phone.trim(), null, password, true);
    } catch (e) {
      Alert.alert(t('Inscription impossible'), e instanceof ApiError ? e.message : t('Réessaie plus tard.'));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <PageHeader back title={t('Créer un compte')} subtitle={t('Ça prend moins d’une minute')} />
      <Field label={t('Nom complet')} icon="person-outline" placeholder="Awa Diop" value={fullName} onChangeText={setFullName} autoComplete="name" />
      <Field label={t('Numéro de téléphone')} icon="call-outline" placeholder="77 123 45 67" keyboardType="phone-pad" value={phone} onChangeText={setPhone}
        hint={t('C’est ton identifiant de connexion et le numéro que tes proches utiliseront pour t’ajouter.')} />
      <Field label={t('Mot de passe')} icon="lock-closed-outline" placeholder={t('8 caractères minimum')} secureTextEntry value={password} onChangeText={setPassword} />
      <Field label={t('Confirmer le mot de passe')} icon="lock-closed-outline" secureTextEntry value={confirm} onChangeText={setConfirm} />

      <Pressable onPress={() => { tap(); setAccepted((v) => !v); }} style={s.terms}>
        <Ionicons name={accepted ? 'checkbox' : 'square-outline'} size={22} color={accepted ? colors.ink : colors.subtle} />
        <Text style={s.termsText}>
          {t('J’accepte les')}{' '}
          <Text style={s.link} onPress={() => router.push('/legal/terms')}>{t('conditions d’utilisation')}</Text>
          {' '}{t('et la')}{' '}
          <Text style={s.link} onPress={() => router.push('/legal/privacy')}>{t('politique de confidentialité')}</Text>.
        </Text>
      </Pressable>

      <Button label={t('Créer mon compte')} onPress={submit} loading={loading} />
    </Screen>
  );
}

const s = StyleSheet.create({
  terms: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginVertical: 12 },
  termsText: { flex: 1, fontSize: 14, color: colors.muted, lineHeight: 20 },
  link: { color: colors.goldDark, fontWeight: '700' },
});
