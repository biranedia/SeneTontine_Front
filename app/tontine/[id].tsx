// app/tontine/[id].tsx — Détail d'une tontine : payer, confirmer, verser le pot, membres.
import React, { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '@/src/context/AuthContext';
import * as tontinesApi from '@/src/api/tontines';
import * as paymentsApi from '@/src/api/payments';
import * as billingApi from '@/src/api/billing';
import { ApiError } from '@/src/api/client';
import { colors, fcfa, radius } from '@/src/theme';
import {
  Avatar, Button, Card, Field, Loading, PageHeader, Pill, ProgressBar, Screen, SectionTitle, StatusBadge, tap,
} from '@/src/components/ui';

function errMsg(e: unknown) {
  return e instanceof ApiError ? e.message : 'Réessaie dans un instant.';
}

export default function TontineDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tontineId = Number(id);
  const { user } = useAuth();

  const [t, setT] = useState<tontinesApi.TontineDetail | null>(null);
  const [payouts, setPayouts] = useState<paymentsApi.PotPayoutInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');

  const load = useCallback(async () => {
    try {
      const [detail, pots] = await Promise.all([
        tontinesApi.getDetail(tontineId),
        paymentsApi.payouts(tontineId).catch(() => []),
      ]);
      setT(detail);
      setPayouts(pots);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setRefreshing(false);
    }
  }, [tontineId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (key: string, action: () => Promise<unknown>, success?: string) => {
    setBusy(key);
    try {
      await action();
      await load();
      if (success) Alert.alert('C’est fait', success);
    } catch (e) {
      Alert.alert('Action impossible', errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  if (!t) {
    if (!error) return <Loading />;
    return (
      <Screen>
        <PageHeader title="Tontine" back />
        <Text style={{ color: colors.danger }}>{error}</Text>
      </Screen>
    );
  }

  const me = t.membersList.find((m) => m.id === user?.userId);
  const iAmCreator = !!me?.creator;
  const isActive = t.status === 'ACTIVE';
  const isPending = t.status === 'PENDING';
  const declared = t.membersList.filter((m) => m.status === 'declared');
  const confirmedCount = t.membersList.filter((m) => m.status === 'paid' || m.status === 'late').length;
  const openPayout = [...payouts].reverse().find((p) => !p.receivedAt);

  const copy = async (value: string, label: string) => {
    await Clipboard.setStringAsync(value.replace(/\s/g, ''));
    tap();
    Alert.alert('Copié', `Numéro ${label} copié.`);
  };

  const shareInvite = () => Share.share({
    message: `Rejoins ma tontine « ${t.name} » sur SèneTontine 🤝\nCotisation : ${t.cotisation}\nCode d'invitation : ${t.inviteCode}`,
  }).catch(() => {});

  const remind = (m: tontinesApi.MemberInfo) => Share.share({
    message: `Salut ${m.name.split(' ')[0]} 👋 Petit rappel pour la tontine « ${t.name} » : ta cotisation de ${fcfa(m.amountDue)} est attendue avant le ${t.prochainTour}. Merci !`,
  }).catch(() => {});

  const renew = async () => {
    setBusy('renew');
    try {
      const q = await billingApi.quote('RENEW', tontineId);
      if (q.hasCredit) {
        const t2 = await tontinesApi.renew(tontineId);
        router.replace({ pathname: '/tontine/[id]', params: { id: String(t2.id) } });
        return;
      }
      Alert.alert(
        'Renouveler la tontine',
        `Mêmes paramètres et mêmes membres (ils seront prévenus et pourront se retirer avant le démarrage). Coût : ${fcfa(q.price)} (+ frais du prestataire de paiement), par Wave ou Orange Money.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: `Payer ${fcfa(q.price)}`, onPress: () => billingApi.startCheckout('RENEW', tontineId)
            .catch((e) => Alert.alert('Paiement impossible', errMsg(e))) },
        ],
      );
    } catch (e) {
      Alert.alert('Renouvellement impossible', errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const confirmLeave = () => Alert.alert(
    'Quitter la tontine ?',
    'Si tu as déjà envoyé ta cotisation de ce tour, le remboursement se règle directement avec le créateur.',
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter', style: 'destructive', onPress: () => run('leave', async () => {
          const r = await tontinesApi.leave(tontineId);
          Alert.alert('Tu as quitté la tontine', r.settleWithCreator
            ? `Vois avec le créateur pour récupérer ${fcfa(r.amountPaidThisRound)}.` : undefined);
          router.back();
        }),
      },
    ],
  );

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <PageHeader
        title={`${t.emoji} ${t.name}`}
        subtitle={`Créée par ${t.createdBy}`}
        back
        right={iAmCreator && isPending ? (
          <Pressable hitSlop={10} onPress={() => router.push({ pathname: '/create-tontine', params: { id: String(t.id) } })} style={s.iconBtn}>
            <Ionicons name="settings-outline" size={20} color={colors.ink} />
          </Pressable>
        ) : undefined}
      />

      {/* Résumé */}
      <View style={s.hero}>
        <View style={s.heroTop}>
          <Text style={s.heroLabel}>{isActive ? `TOUR ${t.currentRound} SUR ${t.membersRequired}` : t.tourLabel.toUpperCase()}</Text>
          {t.status === 'COMPLETED' && <Pill label="Terminée" color={colors.success} bg={colors.successSoft} />}
          {t.status === 'CANCELLED' && <Pill label="Annulée" color={colors.danger} bg={colors.dangerSoft} />}
        </View>
        <Text style={s.heroAmount}>{t.potTotal}</Text>
        <Text style={s.heroSub}>Pot par tour · {t.cotisation} × {t.membersRequired}</Text>
        <View style={{ marginTop: 16 }}><ProgressBar value={t.progress} color={colors.goldLight} track="#3A352D" /></View>
        {isActive && (
          <View style={s.heroInfo}>
            <Info icon="gift-outline" label="Bénéficiaire" value={t.beneficiaire} />
            <Info icon="calendar-outline" label="Échéance" value={t.prochainTour} />
            <Info icon="checkmark-done-outline" label="Confirmés" value={`${confirmedCount}/${t.members}`} />
          </View>
        )}
      </View>

      {/* Ma cotisation */}
      {isActive && me && (
        <>
          <SectionTitle title="Ma cotisation" />
          <Card>
            <View style={s.rowBetween}>
              <Text style={s.amount}>{fcfa(me.amountDue)}</Text>
              <StatusBadge status={me.status} />
            </View>
            {me.status === 'due' && (
              <>
                <Text style={s.help}>
                  {iAmCreator
                    ? 'Tu reçois les cotisations : déclare simplement ta propre part, elle est confirmée automatiquement.'
                    : `Envoie ta cotisation à ${t.createdBy} sur l'un de ces numéros, puis déclare ton paiement.`}
                </Text>
                {!iAmCreator && (
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {t.wavePhone && <PayNumber brand="Wave" color={colors.wave} phone={t.wavePhone} onCopy={() => copy(t.wavePhone!, 'Wave')} />}
                    {t.orangeMoneyPhone && <PayNumber brand="Orange Money" color={colors.orange} phone={t.orangeMoneyPhone} onCopy={() => copy(t.orangeMoneyPhone!, 'Orange Money')} />}
                  </View>
                )}
                {t.penaltyPerDay > 0 && (
                  <Text style={s.note}>Après le {t.prochainTour}, une pénalité de {fcfa(t.penaltyPerDay)} par jour de retard s'ajoute.</Text>
                )}
                <Button label="J’ai payé" icon="checkmark-circle-outline" onPress={() => setDeclareOpen(true)} style={{ marginTop: 14 }} />
              </>
            )}
            {me.status === 'declared' && (
              <Text style={s.help}>Paiement déclaré{me.paymentReference ? ` (réf. ${me.paymentReference})` : ''}. {t.createdBy} doit maintenant confirmer la réception.</Text>
            )}
            {(me.status === 'paid' || me.status === 'late') && (
              <Text style={s.help}>Ta cotisation de ce tour est confirmée. Merci !</Text>
            )}
          </Card>
        </>
      )}

      {/* Confirmations (créateur) */}
      {isActive && iAmCreator && declared.length > 0 && (
        <>
          <SectionTitle title={`À confirmer (${declared.length})`} />
          {declared.map((m) => (
            <Card key={m.id} style={{ marginBottom: 10 }}>
              <View style={s.memberRow}>
                <Avatar name={m.name} base64={m.avatarBase64} />
                <View style={{ flex: 1 }}>
                  <Text style={s.memberName}>{m.name}</Text>
                  <Text style={s.memberSub}>
                    {fcfa(m.amountDue)}{m.paymentMethod ? ` · ${paymentsApi.methodLabel[m.paymentMethod as paymentsApi.PaymentMethod] ?? m.paymentMethod}` : ''}
                    {m.paymentReference ? ` · réf. ${m.paymentReference}` : ''}
                  </Text>
                </View>
              </View>
              <Text style={s.note}>Vérifie que l'argent est bien arrivé sur ton compte avant de confirmer.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <Button small label="Pas reçu" variant="secondary" style={{ flex: 1 }}
                  loading={busy === `r${m.paymentId}`}
                  onPress={() => run(`r${m.paymentId}`, () => paymentsApi.reject(tontineId, m.paymentId!))} />
                <Button small label="Confirmer" icon="checkmark" style={{ flex: 1 }}
                  loading={busy === `c${m.paymentId}`}
                  onPress={() => run(`c${m.paymentId}`, () => paymentsApi.confirm(tontineId, m.paymentId!))} />
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Versement du pot */}
      {openPayout && (
        <>
          <SectionTitle title={`Pot du tour ${openPayout.roundNumber}`} />
          <Card>
            <View style={s.rowBetween}>
              <View>
                <Text style={s.amount}>{fcfa(openPayout.amount)}</Text>
                <Text style={s.memberSub}>pour {openPayout.beneficiaryName}</Text>
              </View>
              <Pill
                label={openPayout.sentAt ? 'Envoyé' : 'À envoyer'}
                color={openPayout.sentAt ? colors.info : colors.warning}
                bg={openPayout.sentAt ? colors.infoSoft : colors.warningSoft}
              />
            </View>
            {iAmCreator && !openPayout.sentAt && (
              <>
                <Text style={s.help}>Toutes les cotisations sont confirmées. Envoie le pot au bénéficiaire depuis ton compte Wave / Orange Money, puis indique-le ici.</Text>
                <Button label="J’ai envoyé le pot" icon="send-outline" style={{ marginTop: 12 }}
                  loading={busy === 'sent'}
                  onPress={() => run('sent', () => paymentsApi.markPotSent(tontineId, openPayout.roundNumber), 'Le bénéficiaire a été prévenu.')} />
              </>
            )}
            {openPayout.beneficiaryId === user?.userId && (
              <>
                <Text style={s.help}>{openPayout.sentAt ? 'Le créateur indique t’avoir envoyé le pot. Confirme dès que tu l’as reçu.' : 'Le créateur va t’envoyer le pot.'}</Text>
                <Button label="J’ai bien reçu le pot" icon="checkmark-done" style={{ marginTop: 12 }}
                  loading={busy === 'recv'}
                  onPress={() => run('recv', () => paymentsApi.markPotReceived(tontineId, openPayout.roundNumber), 'Merci, le groupe est informé.')} />
              </>
            )}
          </Card>
        </>
      )}

      {/* Invitation (recrutement) */}
      {isPending && (
        <>
          <SectionTitle title="Inviter des membres" />
          <Card>
            <Text style={s.help}>{t.members}/{t.membersRequired} membres. La tontine démarre automatiquement quand elle est complète.</Text>
            {iAmCreator ? (
              <>
                <Pressable onPress={() => copy(t.inviteCode, "d'invitation")} style={s.codeBox}>
                  <Text style={s.code}>{t.inviteCode}</Text>
                  <Ionicons name="copy-outline" size={18} color={colors.muted} />
                </Pressable>
                <Button label="Partager l’invitation" icon="logo-whatsapp" onPress={shareInvite} />
                <View style={{ height: 16 }} />
                <Field label="Ou ajouter par numéro" icon="call-outline" placeholder="77 123 45 67" keyboardType="phone-pad"
                  value={invitePhone} onChangeText={setInvitePhone} />
                <Button label="Ajouter" variant="secondary" disabled={!invitePhone.trim()} loading={busy === 'add'}
                  onPress={() => run('add', async () => { await tontinesApi.addMemberByPhone(tontineId, invitePhone.trim()); setInvitePhone(''); }, 'Membre ajouté et prévenu.')} />
              </>
            ) : <Text style={[s.help, { marginTop: 8 }]}>En attente des derniers membres…</Text>}
          </Card>
        </>
      )}

      {/* Membres */}
      <SectionTitle title={`Membres (${t.members})`} />
      <Card style={{ paddingVertical: 4 }}>
        {t.membersList.map((m, i) => {
          const isBeneficiary = isActive && m.turnOrder === t.currentRound;
          return (
            <View key={m.id} style={[s.memberRow, s.memberLine, i === t.membersList.length - 1 && { borderBottomWidth: 0 }]}>
              <Avatar name={m.name} base64={m.avatarBase64} />
              <View style={{ flex: 1 }}>
                <Text style={s.memberName}>{m.name}{m.id === user?.userId ? ' (moi)' : ''}</Text>
                <Text style={s.memberSub}>
                  Tour {m.turnOrder ?? '—'}{m.creator ? ' · Créateur' : ''}{isBeneficiary ? ' · 🎁 bénéficiaire' : ''}
                </Text>
              </View>
              {isActive && (
                iAmCreator && m.status === 'due' && !m.creator
                  ? <Pressable onPress={() => remind(m)} style={s.remindBtn} hitSlop={6}>
                      <Ionicons name="logo-whatsapp" size={14} color={colors.success} />
                      <Text style={s.remindText}>Relancer</Text>
                    </Pressable>
                  : <StatusBadge status={m.status} />
              )}
            </View>
          );
        })}
      </Card>

      {/* Historique des pots */}
      {payouts.some((p) => p.receivedAt) && (
        <>
          <SectionTitle title="Pots versés" />
          <Card style={{ paddingVertical: 4 }}>
            {payouts.filter((p) => p.receivedAt).map((p, i, arr) => (
              <View key={p.id} style={[s.memberRow, s.memberLine, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={s.roundDot}><Text style={s.roundDotText}>{p.roundNumber}</Text></View>
                <Text style={[s.memberName, { flex: 1 }]}>{p.beneficiaryName}</Text>
                <Text style={s.memberSub}>{fcfa(p.amount)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {/* Paramètres & actions */}
      <SectionTitle title="Informations" />
      <Card>
        <InfoLine label="Durée d’un tour" value={`${t.cycleDurationDays} jours`} />
        <InfoLine label="Pénalité de retard" value={t.penaltyPerDay > 0 ? `${fcfa(t.penaltyPerDay)} / jour` : 'Aucune'} />
        <InfoLine label="Visibilité" value={t.isPublic ? 'Publique' : 'Privée (sur invitation)'} last />
      </Card>

      <View style={{ gap: 10, marginTop: 20 }}>
        {iAmCreator && t.status === 'COMPLETED' && !openPayout && (
          <Button label="Renouveler la tontine" icon="refresh" loading={busy === 'renew'} onPress={renew} />
        )}
        <Button label="Signaler un problème" icon="flag-outline" variant="secondary" onPress={() => router.push('/report-incident')} />
        {!iAmCreator && (isActive || isPending) && (
          <Button label="Quitter la tontine" icon="exit-outline" variant="danger" loading={busy === 'leave'} onPress={confirmLeave} />
        )}
      </View>

      <DeclareSheet
        visible={declareOpen}
        onClose={() => setDeclareOpen(false)}
        tontine={t}
        onDone={() => { setDeclareOpen(false); load(); }}
      />
    </Screen>
  );
}

function Info({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Ionicons name={icon} size={16} color={colors.goldLight} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function InfoLine({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[s.rowBetween, { paddingVertical: 10 }, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Text style={s.memberSub}>{label}</Text>
      <Text style={[s.memberName, { fontSize: 14 }]}>{value}</Text>
    </View>
  );
}

function PayNumber({ brand, color, phone, onCopy }: { brand: string; color: string; phone: string; onCopy: () => void }) {
  return (
    <Pressable onPress={onCopy} style={({ pressed }) => [s.payNumber, pressed && { opacity: 0.8 }]}>
      <View style={[s.brandDot, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={s.memberSub}>{brand}</Text>
        <Text style={s.payPhone}>{phone}</Text>
      </View>
      <Ionicons name="copy-outline" size={18} color={colors.muted} />
    </Pressable>
  );
}

function DeclareSheet({ visible, onClose, tontine, onDone }: {
  visible: boolean; onClose: () => void; tontine: tontinesApi.TontineDetail; onDone: () => void;
}) {
  const methods: paymentsApi.PaymentMethod[] = [
    ...(tontine.wavePhone ? ['WAVE' as const] : []),
    ...(tontine.orangeMoneyPhone ? ['ORANGE_MONEY' as const] : []),
  ];
  const [method, setMethod] = useState<paymentsApi.PaymentMethod>(methods[0] ?? 'WAVE');
  const [reference, setReference] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      const p = await paymentsApi.declare(tontine.id, method, reference.trim() || undefined);
      setReference('');
      Alert.alert(
        p.status === 'DECLARED' ? 'Paiement déclaré' : 'Cotisation enregistrée',
        p.status === 'DECLARED'
          ? `${tontine.createdBy} va confirmer la réception.${p.penaltyAmount > 0 ? ` Pénalité de retard incluse : ${fcfa(p.penaltyAmount)}.` : ''}`
          : 'Ta part est confirmée.',
      );
      onDone();
    } catch (e) {
      Alert.alert('Déclaration impossible', errMsg(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetTitle}>Déclarer mon paiement</Text>
        <Text style={s.help}>Indique comment tu as envoyé ta cotisation de {tontine.cotisation}.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 16 }}>
          {methods.map((m) => (
            <Pressable key={m} onPress={() => { tap(); setMethod(m); }}
              style={[s.methodChip, method === m && s.methodChipOn]}>
              <View style={[s.brandDot, { backgroundColor: m === 'WAVE' ? colors.wave : colors.orange }]} />
              <Text style={[s.methodText, method === m && { color: colors.ink }]}>{paymentsApi.methodLabel[m]}</Text>
            </Pressable>
          ))}
        </View>
        <Field label="Référence de transaction (facultatif)" icon="receipt-outline" placeholder="Ex : ID du SMS de confirmation"
          value={reference} onChangeText={setReference} autoCapitalize="characters" maxLength={120} />
        <Button label="Confirmer la déclaration" loading={sending} onPress={submit} />
        <Button label="Annuler" variant="ghost" onPress={onClose} style={{ marginTop: 4 }} />
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },

  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 22 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { color: colors.goldLight, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroAmount: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  heroSub: { color: '#BDB5A8', fontSize: 13, marginTop: 4 },
  heroInfo: { flexDirection: 'row', gap: 12, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#3A352D' },
  infoLabel: { color: '#9E968A', fontSize: 11, marginTop: 6 },
  infoValue: { color: colors.white, fontSize: 14, fontWeight: '700', marginTop: 2 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { fontSize: 22, fontWeight: '800', color: colors.ink },
  help: { fontSize: 14, color: colors.muted, marginTop: 10, lineHeight: 20 },
  note: { fontSize: 12, color: colors.subtle, marginTop: 10, lineHeight: 17 },

  payNumber: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: colors.border },
  brandDot: { width: 12, height: 12, borderRadius: 6 },
  payPhone: { fontSize: 16, fontWeight: '700', color: colors.ink, marginTop: 1, letterSpacing: 0.5 },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberLine: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  memberName: { fontSize: 15, fontWeight: '700', color: colors.ink },
  memberSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  remindBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.successSoft },
  remindText: { fontSize: 12, fontWeight: '700', color: colors.success },
  roundDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  roundDotText: { fontWeight: '800', color: colors.goldDark },

  codeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingVertical: 16, marginVertical: 14, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  code: { fontSize: 24, fontWeight: '800', letterSpacing: 4, color: colors.ink },

  backdrop: { flex: 1, backgroundColor: 'rgba(28,26,23,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.ink },
  methodChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  methodChipOn: { borderColor: colors.ink, backgroundColor: colors.surfaceAlt },
  methodText: { fontSize: 14, fontWeight: '700', color: colors.muted },
});
