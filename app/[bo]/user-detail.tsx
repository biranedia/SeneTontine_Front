// app/[bo]/user-detail.tsx — Fiche utilisateur : infos, modification, actions, historique.
import React, { useCallback, useState } from 'react';
import { Alert, Linking, Text, TextInput, View, StyleSheet } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';
import { colors, fcfa } from '@/src/theme';
import { whatsappUrl } from '@/src/config';
import { ABtn, ACard, AdminPage, Badge, Empty, ErrorBox, Loader, Stat, adminHref, fmtDate, st } from '@/src/components/admin/AdminUI';

const PAY: Record<string, { label: string; tone: 'green' | 'orange' | 'blue' | 'red' | 'gray' }> = {
  PAID: { label: 'Payé', tone: 'green' }, LATE: { label: 'Payé en retard', tone: 'orange' },
  DECLARED: { label: 'À confirmer', tone: 'blue' }, DUE: { label: 'À payer', tone: 'gray' },
};

const intlPhone = (p: string) => {
  const d = p.replace(/\D/g, '');
  return /^7\d{8}$/.test(d) ? `221${d}` : d;
};

export default function AdminUserDetailScreen() {
  const router = useRouter();
  const { user: me } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const [data, setData] = useState<adminApi.UserDetailInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tempPwd, setTempPwd] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await adminApi.userDetail(userId);
      setData(d);
      setName(d.user.fullName);
      setPhone(d.user.phone);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger cette fiche.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) Alert.alert('C’est fait', ok);
      await load();
    } catch (e) {
      Alert.alert('Action impossible', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
    } finally {
      setBusy(null);
    }
  };
  const confirm = (title: string, msg: string, label: string, fn: () => void, destructive = false) =>
    Alert.alert(title, msg, [{ text: 'Annuler', style: 'cancel' }, { text: label, style: destructive ? 'destructive' : 'default', onPress: fn }]);

  if (loading) return <AdminPage title="Fiche utilisateur" back={() => router.replace(adminHref('users'))}><Loader /></AdminPage>;
  if (error || !data) return (
    <AdminPage title="Fiche utilisateur" back={() => router.replace(adminHref('users'))}>
      <ErrorBox text={error ?? 'Utilisateur introuvable.'} onRetry={load} />
    </AdminPage>
  );

  const u = data.user;
  const self = me?.phone === u.phone;
  const deleted = u.phone.startsWith('deleted-');
  const totalPaid = data.payments.filter((p) => p.status === 'PAID' || p.status === 'LATE')
    .reduce((sum, p) => sum + p.amount + p.penaltyAmount, 0);

  return (
    <AdminPage title={u.fullName} subtitle={`${u.phone} · inscrit le ${fmtDate(u.createdAt)}`}
      back={() => router.replace(adminHref('users'))} onRefresh={load}
      actions={<View style={{ flexDirection: 'row', gap: 6 }}>
        {u.role === 'ADMIN' && <Badge label="Admin" tone="gold" />}
        <Badge label={deleted ? 'Supprimé' : u.active ? 'Actif' : 'Bloqué'} tone={deleted ? 'gray' : u.active ? 'green' : 'red'} />
      </View>}>

      <View style={st.grid}>
        <Stat icon="albums-outline" label="Tontines" value={String(data.tontines.length)} />
        <Stat icon="cash-outline" label="Cotisations confirmées" value={fcfa(totalPaid)} />
        <Stat icon="receipt-outline" label="Paiements enregistrés" value={String(data.payments.length)} />
        <Stat icon="flag-outline" label="Signalements envoyés" value={String(data.incidentsCount)} />
      </View>

      {!deleted && (
        <>
          <Text style={st.section}>Actions</Text>
          <ACard style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <ABtn icon="create-outline" label={edit ? 'Fermer la modification' : 'Modifier nom / téléphone'} onPress={() => setEdit((v) => !v)} />
              <ABtn icon="logo-whatsapp" label="Écrire sur WhatsApp"
                onPress={() => Linking.openURL(whatsappUrl(`Bonjour ${u.fullName.split(' ')[0]}, c’est l’équipe SèneTontine.`, intlPhone(u.phone)))} />
              {!self && <ABtn icon="key-outline" label="Réinitialiser le mot de passe" busy={busy === 'pwd'}
                onPress={() => confirm('Réinitialiser le mot de passe ?', `Un mot de passe temporaire sera créé pour ${u.fullName}. Toutes ses sessions seront déconnectées.`,
                  'Réinitialiser', () => run('pwd', async () => setTempPwd((await adminApi.resetPassword(u.id)).temporaryPassword)))} />}
              <ABtn icon="gift-outline" label="Offrir une création de tontine" tone="success" busy={busy === 'gift'}
                onPress={() => confirm('Offrir une création ?', `${u.fullName} pourra créer une tontine sans payer les 2 500 F.`, 'Offrir',
                  () => run('gift', () => adminApi.grantCredit(u.id), 'Création offerte.'))} />
              {!self && <ABtn icon={u.active ? 'lock-closed-outline' : 'lock-open-outline'} label={u.active ? 'Bloquer' : 'Débloquer'} busy={busy === 'act'}
                onPress={() => confirm(u.active ? 'Bloquer ce compte ?' : 'Débloquer ce compte ?', u.active ? 'Le compte sera déconnecté et ne pourra plus se connecter.' : 'Le compte pourra de nouveau se connecter.',
                  u.active ? 'Bloquer' : 'Débloquer', () => run('act', () => adminApi.setUserActive(u.id, !u.active)), u.active)} />}
              {!self && <ABtn icon="shield-outline" label={u.role === 'ADMIN' ? 'Retirer les droits admin' : 'Nommer admin'} busy={busy === 'role'}
                onPress={() => confirm(u.role === 'ADMIN' ? 'Retirer les droits admin ?' : 'Nommer administrateur ?',
                  u.role === 'ADMIN' ? `${u.fullName} redeviendra un membre.` : `${u.fullName} aura accès à tout l’espace admin.`,
                  'Confirmer', () => run('role', () => adminApi.setUserRole(u.id, u.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')), u.role === 'ADMIN')} />}
              {!self && u.role !== 'ADMIN' && <ABtn icon="trash-outline" label="Supprimer le compte" tone="danger" busy={busy === 'del'}
                onPress={() => confirm('Supprimer ce compte ?', `Le compte de ${u.fullName} sera anonymisé et fermé. Ses tontines en cours qu’il a créées seront annulées. Action irréversible.`,
                  'Supprimer', () => run('del', async () => { await adminApi.deleteUser(u.id); router.replace(adminHref('users')); }), true)} />}
            </View>

            {edit && (
              <View style={s.form}>
                <Text style={s.label}>Nom complet</Text>
                <TextInput value={name} onChangeText={setName} style={s.input} />
                <Text style={s.label}>Téléphone</Text>
                <TextInput value={phone} onChangeText={setPhone} style={s.input} keyboardType="phone-pad" />
                <ABtn icon="checkmark" label="Enregistrer" tone="primary" busy={busy === 'save'}
                  onPress={() => run('save', async () => { await adminApi.updateUser(u.id, name.trim(), phone.trim()); setEdit(false); }, 'Fiche mise à jour.')} />
              </View>
            )}

            {tempPwd && (
              <View style={s.temp}>
                <Text style={st.meta}>Mot de passe temporaire à transmettre :</Text>
                <Text selectable style={s.tempPwd}>{tempPwd}</Text>
                <ABtn icon="logo-whatsapp" label="Envoyer par WhatsApp" tone="success"
                  onPress={() => Linking.openURL(whatsappUrl(
                    `Bonjour ${u.fullName.split(' ')[0]}, voici ton mot de passe temporaire SèneTontine : ${tempPwd}\nConnecte-toi sur https://senetontine.com/login puis change-le dans ton profil.`,
                    intlPhone(u.phone)))} />
              </View>
            )}
          </ACard>
        </>
      )}

      <Text style={st.section}>Tontines ({data.tontines.length})</Text>
      <ACard style={{ paddingVertical: 4 }}>
        {data.tontines.length === 0 ? <Empty text="Aucune tontine." /> : data.tontines.map((t, i) => (
          <View key={t.tontineId} style={[st.row, i === data.tontines.length - 1 && st.rowLast]}>
            <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
            <Text style={[st.name, { flex: 1 }]}>{t.tontineName}</Text>
            <Badge label={t.role === 'CREATOR' ? 'Créateur' : 'Membre'} tone={t.role === 'CREATOR' ? 'gold' : 'gray'} />
          </View>
        ))}
      </ACard>

      <Text style={st.section}>Paiements ({data.payments.length})</Text>
      <ACard style={{ paddingVertical: 4 }}>
        {data.payments.length === 0 ? <Empty text="Aucun paiement." /> : data.payments.map((p, i) => {
          const b = PAY[p.status] ?? { label: p.status, tone: 'gray' as const };
          return (
            <View key={`${p.tontineId}-${p.roundNumber}-${i}`} style={[st.row, i === data.payments.length - 1 && st.rowLast]}>
              <View style={{ flex: 1 }}>
                <Text style={st.name}>{p.tontineName} · tour {p.roundNumber}</Text>
                <Text style={st.meta}>{p.paidAt ? `le ${fmtDate(p.paidAt)}` : 'non payé'}{p.penaltyAmount ? ` · pénalité ${fcfa(p.penaltyAmount)}` : ''}</Text>
              </View>
              <Text style={[st.name, { marginRight: 8 }]}>{fcfa(p.amount)}</Text>
              <Badge label={b.label} tone={b.tone} />
            </View>
          );
        })}
      </ACard>
    </AdminPage>
  );
}

const s = StyleSheet.create({
  form: { gap: 8, padding: 14, borderRadius: 12, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, maxWidth: 460 },
  label: { fontSize: 12, fontWeight: '700', color: colors.muted },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.ink },
  temp: { padding: 14, borderRadius: 12, backgroundColor: colors.goldSoft, gap: 8, alignItems: 'flex-start' },
  tempPwd: { fontSize: 24, fontWeight: '800', letterSpacing: 2, color: colors.ink },
});
