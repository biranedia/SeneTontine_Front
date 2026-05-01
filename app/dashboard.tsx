import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomNav from './components/BottomNav';


// ─── Types ───────────────────────────────────────────────
type TontineStatus = 'ACTIF' | 'EN ATTENTE';

interface Tontine {
  id: string;
  name: string;
  members: number;
  tour: string;
  cotisation: string;
  prochainTour: string;
  beneficiaire: string;
  status: TontineStatus;
  progress: number; // 0 à 1
  emoji: string;
}

// ─── Données mock ─────────────────────────────────────────
const tontines: Tontine[] = [
  {
    id: '1',
    name: 'Famille Thiès',
    members: 8,
    tour: 'Tour 4/12',
    cotisation: '25 000 FCFA',
    prochainTour: '15 mars',
    beneficiaire: 'Aminata S.',
    status: 'ACTIF',
    progress: 4 / 12,
    emoji: '👨‍👩‍👧',
  },
  {
    id: '2',
    name: 'Collègues Dakar',
    members: 12,
    tour: 'Tour 2/12',
    cotisation: '50 000 FCFA',
    prochainTour: '20 mars',
    beneficiaire: 'Vous 😊',
    status: 'ACTIF',
    progress: 2 / 12,
    emoji: '💼',
  },
  {
    id: '3',
    name: 'Quartier HLM',
    members: 10,
    tour: '3/10 membres recrutés',
    cotisation: '15 000 FCFA',
    prochainTour: '1er avril',
    beneficiaire: '10 mois',
    status: 'EN ATTENTE',
    progress: 3 / 10,
    emoji: '🏘️',
  },
];

// ─── Composant carte tontine ──────────────────────────────
function TontineCard({ t }: { t: Tontine }) {
  const isActif = t.status === 'ACTIF';
  return (
    <View style={styles.card}>
      {/* Header carte */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardEmoji}>{t.emoji}</Text>
          <View>
            <Text style={styles.cardName}>{t.name}</Text>
            <Text style={styles.cardSub}>{t.members} membres · {t.tour}</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: isActif ? '#D2B95B22' : '#88888822' }]}>
          <Text style={[styles.badgeText, { color: isActif ? '#D2B95B' : '#888' }]}>
            {t.status}
          </Text>
        </View>
      </View>

      {/* Barre de progression */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${t.progress * 100}%` }]} />
      </View>

      {/* Infos bas */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.footerLabel}>Cotisation</Text>
          <Text style={styles.footerValue}>{t.cotisation}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.footerLabel}>
            {isActif ? 'Prochain tour' : 'Démarrage'}
          </Text>
          <Text style={styles.footerValue}>{t.prochainTour}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.footerLabel}>
            {isActif ? 'Bénéficiaire' : 'Durée'}
          </Text>
          <Text style={styles.footerValue}>{t.beneficiaire}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Écran principal ──────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();

  const actions = [
    { icon: '➕', label: 'Créer' },
    { icon: '👥', label: 'Rejoindre' },
    { icon: '💳', label: 'Payer' },
    { icon: '📊', label: 'Rapport' },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2A1E0F" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>FM</Text>
          </View>
          <View>
            <Text style={styles.headerGreet}>Bonjour,</Text>
            <Text style={styles.headerName}>Fatou Mbaye</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.bell}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* ── Solde ── */}
      <View style={styles.balanceBox}>
        <Text style={styles.balanceLabel}>SOLDE TOTAL ÉPARGNÉ</Text>
        <Text style={styles.balanceAmount}>485 000 <Text style={styles.balanceCurrency}>FCFA</Text></Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+25 000</Text>
            <Text style={styles.statLabel}>Ce mois</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Tontines actives</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>⭐ 4.8</Text>
            <Text style={styles.statLabel}>Score</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* ── Actions rapides ── */}
        <View style={styles.actionsRow}>
          {actions.map((a) => (
            <TouchableOpacity key={a.label} style={styles.actionBtn}>
              <View style={styles.actionIcon}>
                <Text style={{ fontSize: 20 }}>{a.icon}</Text>
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Mes tontines ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes tontines</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Voir tout →</Text>
          </TouchableOpacity>
        </View>

        {tontines.map((t) => (
          <TontineCard key={t.id} t={t} />
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Barre de navigation ── */}
      <BottomNav />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5EDD6' },

  // Header
  header: {
    backgroundColor: '#2A1E0F',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#D2B95B',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#2A1E0F', fontWeight: 'bold', fontSize: 16 },
  headerGreet: { color: '#BFA96A', fontSize: 12 },
  headerName: { color: '#FFF8E5', fontWeight: 'bold', fontSize: 16 },
  bell: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3E2F0B',
    alignItems: 'center', justifyContent: 'center',
  },

  // Solde
  balanceBox: {
    backgroundColor: '#2A1E0F',
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
  },
  balanceLabel: { color: '#BFA96A', fontSize: 11, letterSpacing: 1, marginBottom: 4 },
  balanceAmount: { color: '#FFF8E5', fontSize: 36, fontWeight: 'bold' },
  balanceCurrency: { fontSize: 18, color: '#BFA96A' },
  statsRow: { flexDirection: 'row', marginTop: 14, alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#D2B95B', fontWeight: 'bold', fontSize: 14 },
  statLabel: { color: '#BFA96A', fontSize: 10, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#3E2F0B' },

  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    backgroundColor: '#FFF8E5',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    elevation: 2,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#F5EDD6',
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, color: '#3E2F0B', fontWeight: '500' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2A1E0F' },
  sectionLink: { color: '#D2B95B', fontSize: 13 },

  // Card tontine
  card: {
    backgroundColor: '#FFF8E5',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitleRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cardEmoji: { fontSize: 28 },
  cardName: { fontWeight: 'bold', color: '#2A1E0F', fontSize: 15 },
  cardSub: { color: '#7A6030', fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  progressBar: {
    height: 5, backgroundColor: '#E8D9B5',
    borderRadius: 10, marginBottom: 12,
  },
  progressFill: {
    height: 5, backgroundColor: '#D2B95B',
    borderRadius: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerLabel: { color: '#7A6030', fontSize: 11, marginBottom: 2 },
  footerValue: { color: '#2A1E0F', fontWeight: '600', fontSize: 13 },

  // Navbar
  navbar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF8E5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E8D9B5',
    elevation: 10,
  },
  navItem: { alignItems: 'center', gap: 2 },
  navLabel: { fontSize: 10, color: '#7A6030' },
});