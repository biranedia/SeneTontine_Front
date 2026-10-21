// app/legal/about.tsx — Qui est derrière SèneTontine.
import React from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/src/theme';
import { Button, PageHeader, Screen } from '@/src/components/ui';
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappUrl } from '@/src/config';

export default function AboutScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <PageHeader back title="À propos" subtitle="Qui est derrière SèneTontine" />
      <View style={s.card}>
        <Image source={require('../../assets/logo.png')} style={s.logo} />
        <Text style={s.name}>Papa Birane Diao</Text>
        <Text style={s.role}>Fondateur et développeur de SèneTontine · Dakar</Text>
      </View>

      <Text style={s.h}>Mon histoire</Text>
      <Text style={s.p}>
        Au Sénégal, la tontine fait partie de nos vies : entre amis, en famille, au travail ou au marché. Mais elle se gère
        encore souvent sur un cahier ou dans un groupe WhatsApp, avec des oublis, des retards et parfois des disputes.
      </Text>
      <Text style={s.p}>
        Je suis développeur web et mobile. J’ai créé SèneTontine pour que chacun puisse organiser sa tontine simplement,
        voir clairement qui a payé et à qui revient la cagnotte, sans jamais confier son argent à une application.
        J’ai aussi créé SamaSiteWeb, qui permet aux commerçants d’avoir leur site en quelques minutes.
      </Text>

      <Text style={s.h}>Ma promesse</Text>
      <Text style={s.p}>• Ton argent reste entre toi et les membres de ta tontine, via Wave ou Orange Money.</Text>
      <Text style={s.p}>• Tes données ne sont ni vendues ni partagées.</Text>
      <Text style={s.p}>• Une vraie personne te répond, sur WhatsApp ou par e-mail.</Text>

      <Button label="M’écrire sur WhatsApp" style={{ marginTop: 16 }}
        onPress={() => Linking.openURL(whatsappUrl('Bonjour Papa Birane, je vous contacte au sujet de SèneTontine.', SUPPORT_WHATSAPP))} />
      <Button label="M’écrire par e-mail" variant="secondary" style={{ marginTop: 10 }}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=SèneTontine`)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  logo: { width: 64, height: 64, borderRadius: 18, marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  role: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
  h: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 22, marginBottom: 8 },
  p: { fontSize: 15, lineHeight: 23, color: colors.ink, marginBottom: 8 },
});
