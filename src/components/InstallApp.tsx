// Bouton « Installer l'application » (version web / PWA uniquement).
// Android/Chrome : ouvre la fenêtre d'installation native. iPhone : explique Partager → Écran d'accueil.
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme';

type W = Window & { __installPrompt?: any };

function isStandalone() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export function InstallApp({ compact }: { compact?: boolean }) {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setInstalled(isStandalone());
    setCanPrompt(!!(window as W).__installPrompt);
    const on = () => setCanPrompt(true);
    const done = () => setInstalled(true);
    window.addEventListener('installable', on);
    window.addEventListener('appinstalled', done);
    return () => { window.removeEventListener('installable', on); window.removeEventListener('appinstalled', done); };
  }, []);

  if (Platform.OS !== 'web' || installed) return null;

  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const install = async () => {
    const p = (window as W).__installPrompt;
    if (p) {
      p.prompt();
      const { outcome } = await p.userChoice;
      (window as W).__installPrompt = undefined;
      setCanPrompt(false);
      if (outcome === 'accepted') setInstalled(true);
    } else {
      setHelp((h) => !h);
    }
  };

  return (
    <View style={[s.box, compact && { marginTop: 0 }]}>
      <Pressable onPress={install} style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}>
        <View style={s.icon}><Ionicons name="download-outline" size={20} color={colors.goldDark} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Installer l’application</Text>
          <Text style={s.sub}>Sur ton téléphone, comme une vraie appli</Text>
        </View>
        <Ionicons name={canPrompt ? 'chevron-forward' : help ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </Pressable>
      {help && !canPrompt && (
        <Text style={s.help}>
          {ios
            ? 'Dans Safari : touche le bouton Partager (carré avec une flèche), puis « Sur l’écran d’accueil ».'
            : 'Dans Chrome : touche le menu ⋮ en haut à droite, puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».'}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  box: { marginTop: 16, backgroundColor: colors.goldSoft, borderRadius: 16, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.ink },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  help: { fontSize: 13, color: colors.ink, marginTop: 10, lineHeight: 19 },
});
