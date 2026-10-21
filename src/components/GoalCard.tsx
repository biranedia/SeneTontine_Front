import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as savingsApi from '../api/savings';
import { colors, fcfa } from '../theme';
import { Card, ProgressBar } from './ui';

export default function GoalCard({ g, index }: { g: savingsApi.GoalSummary; index: number }) {
  const router = useRouter();
  return (
    <Card delay={index} style={{ marginBottom: 10 }}
      onPress={() => router.push({ pathname: '/epargne/[id]', params: { id: String(g.id) } })}>
      <View style={s.row}>
        <View style={s.emoji}><Text style={{ fontSize: 22 }}>{g.emoji}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{g.name}</Text>
          <Text style={s.sub}>{fcfa(g.savedAmount)} sur {fcfa(g.targetAmount)}</Text>
        </View>
        <Text style={[s.pct, g.completed && { color: colors.success }]}>{g.completed ? '✓' : `${Math.round(g.progress * 100)} %`}</Text>
      </View>
      <View style={{ marginTop: 14 }}><ProgressBar value={g.progress} color={g.completed ? colors.success : colors.gold} /></View>
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  pct: { fontSize: 15, fontWeight: '800', color: colors.ink },
});
