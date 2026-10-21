// app/index.tsx — Page d'accueil publique (visiteurs non connectés).
// Explique SèneTontine, le prix, et mène à l'inscription / la connexion / l'installation.
import React from 'react';
import { Image, Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '@/src/theme';
import { Button, Screen } from '@/src/components/ui';
import { InstallApp } from '@/src/components/InstallApp';
import { SUPPORT_WHATSAPP, whatsappUrl } from '@/src/config';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

const STEPS: { icon: Icon; title: string; text: string }[] = [
  { icon: 'people-outline', title: 'Crée ta tontine', text: 'Montant, nombre de membres, durée d’un tour. Invite tes proches avec un code ou leur numéro.' },
  { icon: 'phone-portrait-outline', title: 'Chacun cotise par Wave ou Orange Money', text: 'Le membre paie directement le créateur, puis déclare son paiement dans l’appli.' },
  { icon: 'checkmark-done-outline', title: 'Le créateur confirme', text: 'Tout le monde voit qui a payé, qui est en retard, et à qui revient la cagnotte.' },
  { icon: 'gift-outline', title: 'La cagnotte tourne', text: 'Chaque tour, un membre reçoit la cagnotte. L’historique reste visible pour tous.' },
];

const PERKS: { icon: Icon; text: string }[] = [
  { icon: 'shield-checkmark-outline', text: 'Aucun argent ne transite par l’appli : il va directement au créateur.' },
  { icon: 'eye-outline', text: 'Transparence totale : chaque cotisation est tracée.' },
  { icon: 'notifications-outline', text: 'Rappels avant chaque échéance.' },
  { icon: 'wallet-outline', text: 'Épargne personnelle gratuite pour tes propres objectifs.' },
];

export default function Landing() {
  const router = useRouter();

  return (
    <Screen edges={['top', 'bottom']}>
      {/* En-tête */}
      <View style={s.top}>
        <View style={s.brandRow}>
          <Image source={require('../assets/logo.png')} style={s.logoSm} />
          <Text style={s.brandName}>SèneTontine</Text>
        </View>
        <Text style={s.topLink} onPress={() => router.push('/login')}>Se connecter</Text>
      </View>

      {/* Héros */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.hero}>
        <Text style={s.kicker}>Tontine en ligne · Sénégal</Text>
        <Text style={s.h1}>Vos tontines,{'\n'}simples et transparentes.</Text>
        <Text style={s.lead}>
          Organise ta tontine entre proches sans cahier ni disputes : cotisations, tours de rôle et rappels, au même endroit.
        </Text>
        <Button label="Créer ma tontine gratuitement" onPress={() => router.push('/register')} />
        <Button label="J’ai déjà un compte" variant="secondary" onPress={() => router.push('/login')} style={{ marginTop: 10 }} />
        <InstallApp />
      </Animated.View>

      {/* Comment ça marche */}
      <Text style={s.h2}>Comment ça marche</Text>
      {STEPS.map((st, i) => (
        <Animated.View key={st.title} entering={FadeInDown.delay(80 * i).duration(350)} style={s.step}>
          <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={s.stepHead}>
              <Ionicons name={st.icon} size={18} color={colors.goldDark} />
              <Text style={s.stepTitle}>{st.title}</Text>
            </View>
            <Text style={s.stepText}>{st.text}</Text>
          </View>
        </Animated.View>
      ))}

      {/* Pourquoi */}
      <Text style={s.h2}>Pourquoi SèneTontine</Text>
      <View style={s.card}>
        {PERKS.map((p) => (
          <View key={p.text} style={s.perk}>
            <Ionicons name={p.icon} size={20} color={colors.success} />
            <Text style={s.perkText}>{p.text}</Text>
          </View>
        ))}
      </View>

      {/* Prix */}
      <Text style={s.h2}>Tarif</Text>
      <View style={[s.card, s.priceCard]}>
        <Text style={s.priceBig}>1<Text style={s.priceSup}>re</Text> tontine offerte</Text>
        <Text style={s.priceText}>Ensuite 2 500 FCFA par nouvelle tontine ou par renouvellement, payés une seule fois par le créateur. Les membres ne paient rien à SèneTontine.</Text>
        <Text style={s.priceText}>L’épargne personnelle est toujours gratuite.</Text>
      </View>

      {/* CTA final */}
      <View style={s.final}>
        <Text style={s.finalTitle}>Prêt à lancer ta tontine ?</Text>
        <Button label="Créer mon compte" onPress={() => router.push('/register')} style={{ alignSelf: 'stretch' }} />
        <Text style={s.help} onPress={() => Linking.openURL(whatsappUrl('Bonjour SèneTontine, j’ai une question.', SUPPORT_WHATSAPP))}>
          Une question ? Écris-nous sur WhatsApp
        </Text>
      </View>

      <View style={s.footer}>
        <Text style={s.footerLink} onPress={() => router.push('/legal/terms')}>Conditions d’utilisation</Text>
        <Text style={s.footerDot}>·</Text>
        <Text style={s.footerLink} onPress={() => router.push('/legal/privacy')}>Confidentialité</Text>
      </View>
      <Text style={s.copy}>© {new Date().getFullYear()} SèneTontine{Platform.OS === 'web' ? ' · senetontine.com' : ''}</Text>
    </Screen>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSm: { width: 36, height: 36, borderRadius: 10 },
  brandName: { fontSize: 18, fontWeight: '800', color: colors.ink },
  topLink: { fontSize: 14, fontWeight: '700', color: colors.goldDark },

  hero: { marginBottom: 12 },
  kicker: { fontSize: 13, fontWeight: '700', color: colors.goldDark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  h1: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, marginBottom: 14 },
  lead: { fontSize: 16, lineHeight: 24, color: colors.muted, marginBottom: 24 },

  h2: { fontSize: 20, fontWeight: '800', color: colors.ink, marginTop: 32, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: colors.white, fontWeight: '800' },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  stepText: { fontSize: 14, lineHeight: 20, color: colors.muted },

  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 14 },
  perk: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  perkText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink },

  priceCard: { backgroundColor: colors.goldSoft, borderColor: colors.goldSoft },
  priceBig: { fontSize: 24, fontWeight: '800', color: colors.ink },
  priceSup: { fontSize: 14 },
  priceText: { fontSize: 14, lineHeight: 20, color: colors.ink },

  final: { marginTop: 36, padding: 22, borderRadius: 20, backgroundColor: colors.ink, alignItems: 'center', gap: 14 },
  finalTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
  help: { fontSize: 13, color: colors.goldLight, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 28 },
  footerLink: { fontSize: 13, color: colors.muted },
  footerDot: { color: colors.subtle },
  copy: { textAlign: 'center', fontSize: 12, color: colors.subtle, marginTop: 8 },
});
