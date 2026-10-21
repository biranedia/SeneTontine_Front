import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { PageHeader, Screen } from './ui';

// Adresse de contact affichée dans les pages légales et sur la fiche Play Store.

export default function LegalPage({ title, updated, sections }: {
  title: string; updated: string; sections: { title: string; body: string }[];
}) {
  return (
    <Screen edges={['top', 'bottom']}>
      <PageHeader back title={title} subtitle={`Mise à jour : ${updated}`} />
      {sections.map((sec) => (
        <View key={sec.title} style={{ marginBottom: 20 }}>
          <Text style={s.h}>{sec.title}</Text>
          <Text style={s.p}>{sec.body}</Text>
        </View>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  h: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  p: { fontSize: 14, color: colors.muted, lineHeight: 21 },
});
