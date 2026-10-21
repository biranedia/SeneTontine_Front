import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/src/theme';
import { useT } from '@/src/i18n';

export default function TabsLayout() {
  // Marge réservée à la barre de navigation Android (boutons ou gestes) en mode bord à bord.
  const insets = useSafeAreaInsets();
  const { t } = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 66 + insets.bottom, paddingTop: 8, paddingBottom: insets.bottom + 10 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="accueil" options={{
        title: t('Accueil'),
        tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />,
      }} />
      <Tabs.Screen name="tontines" options={{
        title: t('Tontines'),
        tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />,
      }} />
      <Tabs.Screen name="profil" options={{
        title: t('Profil'),
        tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={24} color={color} />,
      }} />
    </Tabs>
  );
}
