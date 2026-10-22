// app/(tabs)/accueil.tsx — Accueil : ce que j'ai à faire maintenant, en un coup d'œil.
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/context/AuthContext';
import * as tontinesApi from '@/src/api/tontines';
import * as notificationsApi from '@/src/api/notifications';
import * as announcementsApi from '@/src/api/announcements';
import * as savingsApi from '@/src/api/savings';
import { colors, fcfa, radius } from '@/src/theme';
import { Card, EmptyState, IconName, Screen, SectionTitle, tap } from '@/src/components/ui';
import TontineCard from '@/src/components/TontineCard';
import GoalCard from '@/src/components/GoalCard';

type Todo = { key: string; icon: IconName; color: string; bg: string; title: string; text: string; tontineId: number };

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [tontines, setTontines] = useState<tontinesApi.TontineSummary[]>([]);
  const [unread, setUnread] = useState(0);
  const [goals, setGoals] = useState<savingsApi.GoalSummary[]>([]);
  const [announcement, setAnnouncement] = useState<announcementsApi.AnnouncementInfo | null>(null);
  const [dismissedId, setDismissedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [list, count, ann, g] = await Promise.all([
        tontinesApi.listMine(),
        notificationsApi.unreadCount().catch(() => ({ count: 0 })),
        announcementsApi.latest().catch(() => null),
        savingsApi.list().catch(() => []),
      ]);
      setGoals(g.filter((x) => !x.completed));
      setTontines(list);
      setUnread(count.count);
      setAnnouncement(ann);
    } catch {
      // on garde les dernières données affichées
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const active = tontines.filter((t) => t.status === 'ACTIVE');
  const recruiting = tontines.filter((t) => t.status === 'PENDING');
  const toPay = active.filter((t) => t.myStatus === 'due');
  const totalToPay = toPay.reduce((sum, t) => sum + t.cotisationValue, 0);

  const todos: Todo[] = [
    ...tontines.filter((t) => t.potAction === 'SEND').map((t) => ({
      key: `s${t.id}`, icon: 'send-outline' as IconName, color: colors.goldDark, bg: colors.goldSoft,
      title: `Envoyer le pot de ${fcfa(t.potAmount)}`, text: `à ${t.potBeneficiary} · ${t.name}`, tontineId: t.id,
    })),
    ...tontines.filter((t) => t.potAction === 'RECEIVE').map((t) => ({
      key: `r${t.id}`, icon: 'gift-outline' as IconName, color: colors.success, bg: colors.successSoft,
      title: 'Confirme la réception de ton pot', text: `${fcfa(t.potAmount)} · ${t.name}`, tontineId: t.id,
    })),
    ...active.filter((t) => t.pendingConfirmations > 0).map((t) => ({
      key: `c${t.id}`, icon: 'checkmark-done-outline' as IconName, color: colors.info, bg: colors.infoSoft,
      title: `${t.pendingConfirmations} paiement${t.pendingConfirmations > 1 ? 's' : ''} à confirmer`,
      text: t.name, tontineId: t.id,
    })),
    ...toPay.map((t) => ({
      key: `p${t.id}`, icon: 'wallet-outline' as IconName, color: colors.warning, bg: colors.warningSoft,
      title: `Envoyer ${t.cotisation}`, text: `${t.name} · avant le ${t.prochainTour}`, tontineId: t.id,
    })),
    ...active.filter((t) => t.myStatus === 'declared').map((t) => ({
      key: `d${t.id}`, icon: 'hourglass-outline' as IconName, color: colors.muted, bg: colors.surfaceAlt,
      title: 'En attente de confirmation', text: t.name, tontineId: t.id,
    })),
  ];

  const firstName = user?.fullName.split(' ')[0] ?? '';
  const showAnnouncement = announcement && announcement.id !== dismissedId;

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }}>
      <View style={s.top}>
        <View style={{ flex: 1 }}>
          <Text style={s.hello}>Bonjour {firstName} 👋</Text>
          <Text style={s.helloSub}>Voici l'état de tes tontines</Text>
        </View>
        <Pressable onPress={() => { tap(); router.push('/notifications'); }} style={s.bell} hitSlop={8}>
          <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          {unread > 0 && <View style={s.bellDot}><Text style={s.bellDotText}>{unread > 9 ? '9+' : unread}</Text></View>}
        </Pressable>
      </View>

      {showAnnouncement && (
        <View style={s.announce}>
          <Ionicons name="megaphone-outline" size={18} color={colors.goldDark} />
          <Text style={s.announceText}>{announcement!.message}</Text>
          <Pressable onPress={() => setDismissedId(announcement!.id)} hitSlop={10}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      )}

      <View style={s.hero}>
        <Text style={s.heroLabel}>À ENVOYER CE TOUR</Text>
        <Text style={s.heroAmount}>{fcfa(totalToPay)}</Text>
        <Text style={s.heroSub}>
          {active.length === 0
            ? 'Aucune tontine en cours pour le moment'
            : `${active.length} tontine${active.length > 1 ? 's' : ''} en cours · ${toPay.length} cotisation${toPay.length > 1 ? 's' : ''} à envoyer`}
        </Text>
      </View>

      <View style={s.actions}>
        <QuickAction icon="add" label="Créer" onPress={() => router.push('/create-tontine')} />
        <QuickAction icon="key-outline" label="Rejoindre" onPress={() => router.push('/join')} />
      </View>

      <SectionTitle title="À faire" />
      {loading ? null : todos.length === 0 ? (
        <Card><View style={s.allGood}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
          <Text style={s.allGoodText}>Tu es à jour, rien à faire pour l'instant.</Text>
        </View></Card>
      ) : todos.map((td, i) => (
        <Card key={td.key} delay={i} style={{ marginBottom: 10 }}
          onPress={() => router.push({ pathname: '/tontine/[id]', params: { id: String(td.tontineId) } })}>
          <View style={s.todoRow}>
            <View style={[s.todoIcon, { backgroundColor: td.bg }]}><Ionicons name={td.icon} size={20} color={td.color} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.todoTitle}>{td.title}</Text>
              <Text style={s.todoText} numberOfLines={1}>{td.text}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
          </View>
        </Card>
      ))}

      {active.length > 0 && (
        <>
          <SectionTitle title="En cours" action="Tout voir" onAction={() => router.push('/tontines')} />
          {active.slice(0, 3).map((t, i) => <TontineCard key={t.id} t={t} index={i} />)}
        </>
      )}

      {recruiting.length > 0 && (
        <>
          <SectionTitle title="En recrutement" />
          {recruiting.slice(0, 3).map((t, i) => <TontineCard key={t.id} t={t} index={i} />)}
        </>
      )}

      {goals.length > 0 && (
        <>
          <SectionTitle title="Mon épargne" action="Tout voir" onAction={() => router.push('/tontines')} />
          {goals.slice(0, 2).map((g, i) => <GoalCard key={g.id} g={g} index={i} />)}
        </>
      )}

      {!loading && tontines.length === 0 && (
        <EmptyState icon="people-outline" title="Lance ta première tontine"
          text="Crée une tontine avec tes proches ou rejoins-en une grâce au code reçu par WhatsApp."
          action="Créer une tontine" onAction={() => router.push('/create-tontine')} />
      )}
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} style={({ pressed }) => [s.qa, pressed && { opacity: 0.8 }]}>
      <View style={s.qaIcon}><Ionicons name={icon} size={22} color={colors.ink} /></View>
      <Text style={s.qaLabel}>{label}</Text>
    </Pressable>
  );
}


const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  helloSub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellDotText: { color: colors.white, fontSize: 9, fontWeight: '800' },

  announce: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.goldSoft, borderRadius: radius.md, padding: 12, marginBottom: 16 },
  announceText: { flex: 1, fontSize: 13, color: colors.ink, lineHeight: 18 },

  hero: { backgroundColor: colors.ink, borderRadius: radius.xl, padding: 22 },
  heroLabel: { color: colors.goldLight, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroAmount: { color: colors.white, fontSize: 32, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  heroSub: { color: '#BDB5A8', fontSize: 13, marginTop: 6 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  qa: { flex: 1, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 14, borderWidth: 1, borderColor: colors.border },
  qaIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  qaLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },

  allGood: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  allGoodText: { fontSize: 14, color: colors.ink, flex: 1 },

  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todoIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  todoTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  todoText: { fontSize: 13, color: colors.muted, marginTop: 2 },

});
