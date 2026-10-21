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
import { useT } from '@/src/i18n';
import { LangSwitch } from '@/src/components/LangSwitch';
import { SUPPORT_DISPLAY, SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappUrl } from '@/src/config';

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
  const { t } = useT();

  return (
    <Screen edges={['top', 'bottom']}>
      {/* En-tête */}
      <View style={s.top}>
        <View style={s.brandRow}>
          <Image source={require('../assets/logo.png')} style={s.logoSm} />
          <Text style={s.brandName}>SèneTontine</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <LangSwitch />
          <Text style={s.topLink} onPress={() => router.push('/login' as any)}>{t('Se connecter')}</Text>
        </View>
      </View>

      {/* Héros */}
      <Animated.View entering={FadeInDown.duration(400)} style={s.hero}>
        <Text style={s.kicker}>{t('Tontine en ligne · Sénégal')}</Text>
        <Text style={s.h1}>{t('Vos tontines,\nsimples et transparentes.')}</Text>
        <Text style={s.lead}>{t('Organise ta tontine entre proches sans cahier ni disputes : cotisations, tours de rôle et rappels, au même endroit.')}</Text>
        <Button label={t('Créer ma tontine gratuitement')} onPress={() => router.push('/register')} />
        <Button label={t('J’ai déjà un compte')} variant="secondary" onPress={() => router.push('/login' as any)} style={{ marginTop: 10 }} />
        <InstallApp />
      </Animated.View>

      {/* Comment ça marche */}
      <Text style={s.h2}>{t('Comment ça marche')}</Text>
      {STEPS.map((st, i) => (
        <Animated.View key={t(st.title)} entering={FadeInDown.delay(80 * i).duration(350)} style={s.step}>
          <View style={s.stepNum}><Text style={s.stepNumText}>{i + 1}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={s.stepHead}>
              <Ionicons name={st.icon} size={18} color={colors.goldDark} />
              <Text style={s.stepTitle}>{t(st.title)}</Text>
            </View>
            <Text style={s.stepText}>{t(st.text)}</Text>
          </View>
        </Animated.View>
      ))}

      {/* Pourquoi */}
      <Text style={s.h2}>{t('Pourquoi SèneTontine')}</Text>
      <View style={s.card}>
        {PERKS.map((p) => (
          <View key={p.text} style={s.perk}>
            <Ionicons name={p.icon} size={20} color={colors.success} />
            <Text style={s.perkText}>{t(p.text)}</Text>
          </View>
        ))}
      </View>

      {/* Prix */}
      <Text style={s.h2}>{t('Tarif')}</Text>
      <View style={[s.card, s.priceCard]}>
        <Text style={s.priceBig}>{t('1re tontine offerte')}</Text>
        <Text style={s.priceText}>{t('Ensuite 2 500 FCFA par nouvelle tontine ou par renouvellement, payés une seule fois par le créateur. Les membres ne paient rien à SèneTontine.')}</Text>
        <Text style={s.priceText}>{t('L’épargne personnelle est toujours gratuite.')}</Text>
      </View>

      {/* Qui sommes-nous */}
      <Text style={s.h2}>{t('Qui est derrière SèneTontine')}</Text>
      <View style={s.card}>
        <View style={s.founderRow}>
          <View style={s.founderAvatar}><Text style={s.founderInitials}>PB</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.founderName}>Papa Birane Diao</Text>
            <Text style={s.founderRole}>{t('Fondateur et développeur')}</Text>
          </View>
        </View>
        <Text style={s.perkText}>{t('J’ai créé SèneTontine parce que la tontine est au cœur de nos familles et de nos quartiers, mais qu’elle se gère encore sur un cahier ou dans un groupe WhatsApp, avec des oublis et des malentendus. L’objectif : une tontine claire pour tout le monde, sans jamais toucher à votre argent.')}</Text>
        <Text style={s.perkText}>{t('Une question, une idée ou un souci ? Je réponds personnellement.')}</Text>
        <View style={{ gap: 6 }}>
          <Text style={s.contactLink} onPress={() => Linking.openURL(whatsappUrl('Bonjour Papa Birane, j’ai une question sur SèneTontine.', SUPPORT_WHATSAPP))}>WhatsApp : {SUPPORT_DISPLAY}</Text>
          <Text style={s.contactLink} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('SèneTontine')}`)}>E-mail : {SUPPORT_EMAIL}</Text>
        </View>
        <Text style={s.more} onPress={() => router.push('/legal/about' as any)}>{t('En savoir plus')} →</Text>
      </View>

      {/* CTA final */}
      <View style={s.final}>
        <Text style={s.finalTitle}>{t('Prêt à lancer ta tontine ?')}</Text>
        <Button label={t('Créer mon compte')} onPress={() => router.push('/register')} style={{ alignSelf: 'stretch' }} />
        <Text style={s.help} onPress={() => Linking.openURL(whatsappUrl('Bonjour SèneTontine, j’ai une question.', SUPPORT_WHATSAPP))}>
          {t('Une question ? Écris-nous sur WhatsApp')}
        </Text>
      </View>

      <View style={s.footer}>
        <Text style={s.footerLink} onPress={() => router.push('/legal/terms')}>{t('Conditions d’utilisation')}</Text>
        <Text style={s.footerDot}>·</Text>
        <Text style={s.footerLink} onPress={() => router.push('/legal/privacy')}>{t('Confidentialité')}</Text>
        <Text style={s.footerDot}>·</Text>
        <Text style={s.footerLink} onPress={() => router.push('/legal/mentions' as any)}>{t('Mentions légales')}</Text>
        <Text style={s.footerDot}>·</Text>
        <Text style={s.footerLink} onPress={() => router.push('/legal/about' as any)}>{t('À propos')}</Text>
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

  founderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  founderAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  founderInitials: { color: colors.goldLight, fontWeight: '800', fontSize: 16 },
  founderName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  founderRole: { fontSize: 13, color: colors.muted, marginTop: 2 },
  contactLink: { fontSize: 14, fontWeight: '700', color: colors.goldDark },
  final: { marginTop: 36, padding: 22, borderRadius: 20, backgroundColor: colors.ink, alignItems: 'center', gap: 14 },
  finalTitle: { fontSize: 20, fontWeight: '800', color: colors.white },
  help: { fontSize: 13, color: colors.goldLight, fontWeight: '700' },

  footer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 28 },
  more: { fontSize: 14, fontWeight: '700', color: colors.goldDark },
  footerLink: { fontSize: 13, color: colors.muted },
  footerDot: { color: colors.subtle },
  copy: { textAlign: 'center', fontSize: 12, color: colors.subtle, marginTop: 8 },
});
