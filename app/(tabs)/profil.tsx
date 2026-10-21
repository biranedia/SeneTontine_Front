// app/(tabs)/profil.tsx — Profil, réglages, administration, suppression de compte.
import { shrinkToBase64 } from '@/src/lib/shrinkImage';
import { InstallApp } from '@/src/components/InstallApp';
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/context/AuthContext';
import * as usersApi from '@/src/api/users';
import * as statsApi from '@/src/api/stats';
import { ApiError } from '@/src/api/client';
import { colors, fcfa, radius } from '@/src/theme';
import { Avatar, Button, Card, Field, ListRow, Screen, SectionTitle, tap } from '@/src/components/ui';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, logoutOtherDevices, setFullName } = useAuth();
  const [profile, setProfile] = useState<usersApi.ProfileInfo | null>(null);
  const [stats, setStats] = useState<statsApi.UserStatsInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editName, setEditName] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, st] = await Promise.all([usersApi.me(), statsApi.myStats().catch(() => null)]);
      setProfile(p);
      setStats(st);
    } catch {
      // affichage avec les infos de session
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Accès refusé', 'Autorise l’accès aux photos pour changer ta photo de profil.');
    const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5, allowsEditing: true, aspect: [1, 1] });
    if (res.canceled || !res.assets[0]) return;
    try {
      const b64 = await shrinkToBase64(res.assets[0].uri, res.assets[0].base64);
      if (!b64) return Alert.alert('Échec', 'Impossible de lire cette photo. Essaie une autre image.');
      setProfile(await usersApi.updateAvatar(b64));
      tap();
    } catch (e) {
      Alert.alert('Échec', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    }
  };

  const saveName = async () => {
    if (!editName?.trim()) return;
    try {
      const p = await usersApi.updateName(editName.trim());
      setProfile(p);
      await setFullName(p.fullName);
      setEditName(null);
    } catch (e) {
      Alert.alert('Échec', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    }
  };

  const name = profile?.fullName ?? user?.fullName ?? '';

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <View style={s.head}>
        <Pressable onPress={() => { tap(); pickAvatar(); }}>
          <Avatar name={name} base64={profile?.avatarBase64} size={84} />
          <View style={s.camera}><Ionicons name="camera" size={14} color={colors.white} /></View>
        </Pressable>
        {editName === null ? (
          <Pressable onPress={() => setEditName(name)} style={s.nameRow}>
            <Text style={s.name}>{name}</Text>
            <Ionicons name="pencil" size={14} color={colors.subtle} />
          </Pressable>
        ) : (
          <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
            <Field label="Nom affiché" value={editName} onChangeText={setEditName} autoFocus maxLength={80} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button small label="Annuler" variant="secondary" onPress={() => setEditName(null)} style={{ flex: 1 }} />
              <Button small label="Enregistrer" onPress={saveName} style={{ flex: 1 }} />
            </View>
          </View>
        )}
        <Text style={s.phone}>{profile?.phone ?? user?.phone}</Text>
      </View>

      <View style={s.statsRow}>
        <Stat label="Confiance" value={`${(profile?.trustScore ?? 5).toFixed(1)} ★`} />
        <Stat label="Tontines" value={String((stats?.activeTontines ?? 0) + (stats?.pendingTontines ?? 0))} />
        <Stat label="Paiements" value={String(stats?.paymentsMade ?? 0)} />
      </View>
      {stats && (
        <Card style={{ marginTop: 12 }}>
          <Text style={s.small}>Total cotisé (confirmé)</Text>
          <Text style={s.big}>{fcfa(stats.totalSaved)}</Text>
        </Card>
      )}

      <SectionTitle title="Mon compte" />
      <Card style={{ paddingVertical: 2 }}>
        <ListRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <ListRow icon="flag-outline" label="Signaler un problème" onPress={() => router.push('/report-incident')} />
        <ListRow icon="document-text-outline" label="Mes signalements" onPress={() => router.push('/my-reports')} />
        <ListRow icon="lock-closed-outline" label="Déconnecter mes autres appareils" last onPress={() => Alert.alert(
          'Déconnecter les autres appareils ?', 'Seul ce téléphone restera connecté.',
          [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', onPress: () => logoutOtherDevices().then(() => Alert.alert('C’est fait')).catch(() => Alert.alert('Échec')) }],
        )} />
      </Card>

      <InstallApp compact />
      <SectionTitle title="Informations" />
      <Card style={{ paddingVertical: 2 }}>
        <ListRow icon="document-outline" label="Conditions d’utilisation" onPress={() => router.push('/legal/terms')} />
        <ListRow icon="shield-checkmark-outline" label="Confidentialité" last onPress={() => router.push('/legal/privacy')} />
      </Card>

      <View style={{ gap: 10, marginTop: 24 }}>
        <Button label="Se déconnecter" icon="log-out-outline" variant="secondary" onPress={() => logout()} />
        <Button label="Supprimer mon compte" variant="ghost" onPress={() => setDeleteOpen(true)} />
      </View>
      <Text style={s.version}>SèneTontine · version 1.0.0</Text>

      <DeleteAccountSheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} onDeleted={() => { setDeleteOpen(false); logout(); }} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.small}>{label}</Text>
    </View>
  );
}

function DeleteAccountSheet({ visible, onClose, onDeleted }: { visible: boolean; onClose: () => void; onDeleted: () => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await usersApi.deleteAccount(password);
      setPassword('');
      Alert.alert('Compte supprimé', 'Tes données personnelles ont été effacées.');
      onDeleted();
    } catch (e) {
      Alert.alert('Suppression impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <Text style={s.sheetTitle}>Supprimer mon compte</Text>
        <Text style={s.sheetText}>
          Ton nom, ton numéro et ta photo seront définitivement effacés et tu ne pourras plus te connecter.
          Les cotisations passées restent visibles anonymement dans l’historique des tontines.
          Impossible tant que tu participes à une tontine en cours.
        </Text>
        <TextInput style={s.pwd} placeholder="Ton mot de passe" placeholderTextColor={colors.subtle} secureTextEntry value={password} onChangeText={setPassword} />
        <Button label="Supprimer définitivement" variant="danger" loading={loading} disabled={!password} onPress={submit} />
        <Button label="Annuler" variant="ghost" onPress={onClose} style={{ marginTop: 4 }} />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  head: { alignItems: 'center', marginBottom: 20 },
  camera: { position: 'absolute', right: 0, bottom: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  name: { fontSize: 22, fontWeight: '800', color: colors.ink },
  phone: { fontSize: 14, color: colors.muted, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.ink },
  small: { fontSize: 12, color: colors.muted, marginTop: 2 },
  big: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 4 },
  version: { textAlign: 'center', fontSize: 12, color: colors.subtle, marginTop: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(28,26,23,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.danger },
  sheetText: { fontSize: 14, color: colors.muted, lineHeight: 20, marginTop: 10, marginBottom: 16 },
  pwd: { backgroundColor: colors.surfaceAlt, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 15, color: colors.ink, marginBottom: 14 },
});
