// Composants de l'espace admin : barre latérale, en-tête de page, cartes, badges, boutons.
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme';
import { backofficeKey } from '@/src/api/client';
import { useAuth } from '@/src/context/AuthContext';

type Icon = React.ComponentProps<typeof Ionicons>['name'];

export const NAV: { page: string; label: string; icon: Icon }[] = [
  { page: 'overview', label: 'Tableau de bord', icon: 'speedometer-outline' },
  { page: 'users', label: 'Utilisateurs', icon: 'people-outline' },
  { page: 'tontines', label: 'Tontines', icon: 'albums-outline' },
  { page: 'revenue', label: 'Revenus', icon: 'cash-outline' },
  { page: 'incidents', label: 'Signalements', icon: 'flag-outline' },
  { page: 'broadcast', label: 'Annonces', icon: 'megaphone-outline' },
  { page: 'audit-logs', label: 'Journal d’audit', icon: 'document-text-outline' },
];

export const adminHref = (page: string, params?: Record<string, string>) =>
  ({ pathname: `/${backofficeKey()}/${page}`, params }) as any;

const SIDEBAR_W = 248;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const seg = pathname.split('/')[2];
  const current = seg === 'user-detail' ? 'users' : seg;
  return (
    <View style={s.sidebar}>
      <View style={s.brand}>
        <Image source={require('../../../assets/logo.png')} style={s.logo} />
        <View>
          <Text style={s.brandName}>SèneTontine</Text>
          <Text style={s.brandSub}>Administration</Text>
        </View>
      </View>
      <View style={{ gap: 4, flex: 1 }}>
        {NAV.map((n) => {
          const on = current === n.page;
          return (
            <Pressable key={n.page} onPress={() => { router.replace(adminHref(n.page)); onNavigate?.(); }}
              style={({ hovered }: any) => [s.navItem, on && s.navOn, hovered && !on && s.navHover]}>
              <Ionicons name={n.icon} size={19} color={on ? colors.ink : '#B8B0A2'} />
              <Text style={[s.navText, on && s.navTextOn]}>{n.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable onPress={() => router.replace('/accueil')} style={({ hovered }: any) => [s.navItem, hovered && s.navHover]}>
        <Ionicons name="arrow-back-outline" size={19} color="#B8B0A2" />
        <Text style={s.navText}>Retour à l’appli</Text>
      </Pressable>
      <View style={s.me}>
        <View style={s.meAvatar}><Text style={s.meInitial}>{(user?.fullName ?? 'A').slice(0, 1)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.meName} numberOfLines={1}>{user?.fullName ?? 'Admin'}</Text>
          <Text style={s.meRole}>Administrateur</Text>
        </View>
      </View>
    </View>
  );
}

// Cadre de l'espace admin : barre latérale fixe sur grand écran, menu repliable sur téléphone.
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const [open, setOpen] = useState(false);
  if (wide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        <Sidebar />
        <View style={{ flex: 1 }}>{children}</View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={s.mobileBar}>
        <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityLabel="Ouvrir le menu">
          <Ionicons name="menu" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={s.mobileTitle}>SèneTontine · Admin</Text>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
      {open && (
        <View style={s.overlay}>
          <Sidebar onNavigate={() => setOpen(false)} />
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={() => setOpen(false)} />
        </View>
      )}
    </View>
  );
}

// Page : titre, sous-titre, actions à droite, contenu défilant.
export function AdminPage({ title, subtitle, actions, children, onRefresh, back }: {
  title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode;
  onRefresh?: () => void; back?: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
      {back && (
        <Pressable onPress={back} style={s.back}>
          <Ionicons name="chevron-back" size={18} color={colors.muted} />
          <Text style={s.backText}>Retour</Text>
        </Pressable>
      )}
      <View style={s.pageHead}>
        <View style={{ flex: 1, minWidth: 200 }}>
          <Text style={s.pageTitle}>{title}</Text>
          {!!subtitle && <Text style={s.pageSub}>{subtitle}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {onRefresh && <ABtn icon="refresh" label="Actualiser" onPress={onRefresh} />}
          {actions}
        </View>
      </View>
      {children}
    </ScrollView>
  );
}

export function ACard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function ABtn({ label, icon, onPress, tone = 'default', disabled, busy }: {
  label: string; icon?: Icon; onPress: () => void; tone?: 'default' | 'primary' | 'danger' | 'success'; disabled?: boolean; busy?: boolean;
}) {
  const t = {
    default: { bg: colors.surface, fg: colors.ink, bd: colors.border },
    primary: { bg: colors.ink, fg: colors.white, bd: colors.ink },
    danger: { bg: colors.dangerSoft, fg: colors.danger, bd: colors.dangerSoft },
    success: { bg: colors.successSoft, fg: colors.success, bd: colors.successSoft },
  }[tone];
  return (
    <Pressable onPress={onPress} disabled={disabled || busy}
      style={({ pressed, hovered }: any) => [s.btn, { backgroundColor: t.bg, borderColor: t.bd },
        (pressed || hovered) && { opacity: 0.85 }, (disabled || busy) && { opacity: 0.5 }]}>
      {busy ? <ActivityIndicator size="small" color={t.fg} /> : icon ? <Ionicons name={icon} size={16} color={t.fg} /> : null}
      <Text style={[s.btnText, { color: t.fg }]}>{label}</Text>
    </Pressable>
  );
}

export type Tone = 'gray' | 'green' | 'orange' | 'red' | 'blue' | 'gold';

export function Badge({ label, tone }: { label: string; tone: Tone }) {
  const c = {
    gray: [colors.surfaceAlt, colors.muted], green: [colors.successSoft, colors.success],
    orange: [colors.warningSoft, colors.warning], red: [colors.dangerSoft, colors.danger],
    blue: [colors.infoSoft, colors.info], gold: [colors.goldSoft, colors.goldDark],
  }[tone];
  return <View style={[s.badge, { backgroundColor: c[0] }]}><Text style={[s.badgeText, { color: c[1] }]}>{label}</Text></View>;
}

export function SearchBox({ value, onChangeText, onSubmit, placeholder }: {
  value: string; onChangeText: (v: string) => void; onSubmit?: () => void; placeholder: string;
}) {
  return (
    <View style={s.search}>
      <Ionicons name="search" size={17} color={colors.subtle} />
      <TextInput value={value} onChangeText={onChangeText} onSubmitEditing={onSubmit} placeholder={placeholder}
        placeholderTextColor={colors.subtle} style={s.searchInput} returnKeyType="search" />
    </View>
  );
}

export function Chips<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[];
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[s.chip, on && s.chipOn]}>
            <Text style={[s.chipText, on && { color: colors.white }]}>{o.label}{o.count != null ? ` · ${o.count}` : ''}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Stat({ label, value, icon }: { label: string; value: string; icon: Icon }) {
  return (
    <View style={s.stat}>
      <View style={s.statIcon}><Ionicons name={icon} size={18} color={colors.goldDark} /></View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return <Text style={s.empty}>{text}</Text>;
}

export function Loader() {
  return <View style={{ padding: 40 }}><ActivityIndicator color={colors.goldDark} /></View>;
}

export function ErrorBox({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <ACard style={{ alignItems: 'center', gap: 12 }}>
      <Text style={{ color: colors.danger, fontWeight: '700', textAlign: 'center' }}>{text}</Text>
      {onRetry && <ABtn label="Réessayer" icon="refresh" onPress={onRetry} />}
    </ACard>
  );
}

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

export const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLast: { borderBottomWidth: 0 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  section: { fontSize: 16, fontWeight: '800', color: colors.ink, marginTop: 22, marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.goldDark, fontWeight: '800' },
});

const s = StyleSheet.create({
  sidebar: { width: SIDEBAR_W, backgroundColor: '#1C1A17', paddingVertical: 20, paddingHorizontal: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, marginBottom: 26 },
  logo: { width: 38, height: 38, borderRadius: 11 },
  brandName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  brandSub: { color: '#B8B0A2', fontSize: 12 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 12 },
  navOn: { backgroundColor: colors.goldLight },
  navHover: { backgroundColor: '#2E2A24' },
  navText: { color: '#E4DED3', fontSize: 14, fontWeight: '600' },
  navTextOn: { color: colors.ink, fontWeight: '800' },
  me: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, paddingHorizontal: 6, borderTopWidth: 1, borderTopColor: '#2E2A24' },
  meAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  meInitial: { color: colors.ink, fontWeight: '800' },
  meName: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  meRole: { color: '#B8B0A2', fontSize: 11 },
  mobileBar: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1C1A17', paddingHorizontal: 16, paddingVertical: 14 },
  mobileTitle: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  page: { padding: 24, paddingBottom: 60, maxWidth: 1200, width: '100%', alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 10 },
  backText: { color: colors.muted, fontWeight: '600' },
  pageHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 20 },
  pageTitle: { fontSize: 24, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  pageSub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, flex: 1, minWidth: 220 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: colors.ink, outlineStyle: 'none' } as any,
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  stat: { flexGrow: 1, flexBasis: 160, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 12, color: colors.muted },
  empty: { textAlign: 'center', color: colors.muted, padding: 30 },
});
