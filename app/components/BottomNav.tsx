import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const NAV_ITEMS = [
  { icon: '🏠', label: 'Accueil',  route: '/dashboard' },
  { icon: '🤝', label: 'Tontines', route: '/tontines' },
  { icon: '💬', label: 'Chat',     route: '/chat' },
  { icon: '📈', label: 'Stats',    route: '/stats' },
  { icon: '👤', label: 'Profil',   route: '/profil' },
];

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.navbar}>
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.route ||
          // cas détail : /tontines/xxx → highlight "Tontines"
          (item.route === '/tontines' && pathname.startsWith('/tontines'));

        return (
          <TouchableOpacity
            key={item.label}
            style={styles.navItem}
            onPress={() => router.push(item.route as any)}
          >
            {/* Glow marron derrière l'icône active */}
            {isActive && <View style={styles.glow} />}
            <Text style={[styles.navIcon, isActive && styles.navIconActive]}>
              {item.icon}
            </Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF8E5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E8D9B5',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  navItem: {
    alignItems: 'center',
    gap: 3,
    position: 'relative',
    paddingHorizontal: 10,
  },
  glow: {
    position: 'absolute',
    top: -4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E2F0B',
    opacity: 0.15,
    // halo plus large via shadow
    shadowColor: '#3E2F0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 0,
  },
  navIcon:       { fontSize: 22 },
  navIconActive: { /* l'emoji reste tel quel, le glow fait le job */ },
  navLabel:      { fontSize: 10, color: '#7A6030' },
  navLabelActive:{ color: '#3E2F0B', fontWeight: '700' },
});