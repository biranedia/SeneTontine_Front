import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomNav from './components/BottomNav';

const tontines = [
  {
    id: '1', name: 'Famille Thiès',    emoji: '👨‍👩‍👧', members: 8,
    tour: '4/12', cotisation: '25 000 FCFA', status: 'ACTIF',    progress: 4/12,
  },
  {
    id: '2', name: 'Collègues Dakar',  emoji: '💼',    members: 12,
    tour: '2/12', cotisation: '50 000 FCFA', status: 'ACTIF',    progress: 2/12,
  },
  {
    id: '3', name: 'Quartier HLM',     emoji: '🏘️',   members: 10,
    tour: '3/10', cotisation: '15 000 FCFA', status: 'EN ATTENTE', progress: 3/10,
  },
];

export default function TontinesScreen() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#2A1E0F" />

      <View style={s.header}>
        <Text style={s.headerTitle}>Mes Tontines 🤝</Text>
        <TouchableOpacity style={s.newBtn} onPress={() => {}}>
          <Text style={s.newBtnText}>+ Nouvelle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {tontines.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={s.card}
            onPress={() => router.push(`/tontines/${t.id}` as any)}
            activeOpacity={0.85}
          >
            <View style={s.cardTop}>
              <View style={s.cardLeft}>
                <Text style={s.emoji}>{t.emoji}</Text>
                <View>
                  <Text style={s.name}>{t.name}</Text>
                  <Text style={s.sub}>{t.members} membres · Tour {t.tour}</Text>
                </View>
              </View>
              <View style={[s.badge, { backgroundColor: t.status === 'ACTIF' ? '#D2B95B22' : '#88888822' }]}>
                <Text style={[s.badgeText, { color: t.status === 'ACTIF' ? '#D2B95B' : '#888' }]}>
                  {t.status}
                </Text>
              </View>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, { width: `${t.progress * 100}%` }]} />
            </View>
            <View style={s.cardBottom}>
              <Text style={s.cot}>{t.cotisation} / mois</Text>
              <Text style={s.voir}>Voir →</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F5EDD6' },
  header:     {
    backgroundColor: '#2A1E0F', paddingTop: 54, paddingBottom: 20,
    paddingHorizontal: 20, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle:{ color: '#FFF8E5', fontSize: 22, fontWeight: 'bold' },
  newBtn:     {
    backgroundColor: '#D2B95B', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 20,
  },
  newBtnText: { color: '#2A1E0F', fontWeight: 'bold', fontSize: 13 },
  card:       {
    backgroundColor: '#FFF8E5', marginHorizontal: 16, marginTop: 14,
    borderRadius: 18, padding: 16, elevation: 3,
    shadowColor: '#2A1E0F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6,
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji:      { fontSize: 28 },
  name:       { fontWeight: 'bold', color: '#2A1E0F', fontSize: 15 },
  sub:        { color: '#7A6030', fontSize: 12, marginTop: 2 },
  badge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText:  { fontSize: 11, fontWeight: 'bold' },
  progressBg: { height: 5, backgroundColor: '#E8D9B5', borderRadius: 10, marginBottom: 10 },
  progressFill:{ height: 5, backgroundColor: '#D2B95B', borderRadius: 10 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cot:        { color: '#3E2F0B', fontWeight: '600', fontSize: 13 },
  voir:       { color: '#D2B95B', fontWeight: 'bold', fontSize: 13 },
});