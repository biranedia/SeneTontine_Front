// Sélecteur Français / Wolof.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';
import { Lang, useT } from '@/src/i18n';
import { tap } from '@/src/components/ui';

export function LangSwitch() {
  const { lang, setLang } = useT();
  const opt = (l: Lang, label: string) => (
    <Pressable key={l} onPress={() => { tap(); setLang(l); }} style={[s.opt, lang === l && s.on]}
      accessibilityRole="button" accessibilityState={{ selected: lang === l }}>
      <Text style={[s.txt, lang === l && s.txtOn]}>{label}</Text>
    </Pressable>
  );
  return <View style={s.wrap}>{opt('fr', 'FR')}{opt('wo', 'WO')}</View>;
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 999, borderWidth: 1, borderColor: colors.border, padding: 2 },
  opt: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  on: { backgroundColor: colors.ink },
  txt: { fontSize: 12, fontWeight: '800', color: colors.muted },
  txtOn: { color: colors.white },
});
