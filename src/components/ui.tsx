// app/components/ui.tsx — Composants partagés du design system SèneTontine.
import React from 'react';
import {
  ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle, StyleProp, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, radius, shadow, statusColors, type MemberStatus } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function tap() {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

// Écran standard : zone sûre + défilement + tirer pour rafraîchir + gestion du clavier.
export function Screen({
  children, refreshing, onRefresh, scroll = true, padded = true, edges = ['top'],
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && { padding: 20 }, { paddingBottom: 40 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? (
        <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.gold} colors={[colors.gold]} />
      ) : undefined}
    >
      {children}
    </ScrollView>
  ) : <View style={[{ flex: 1 }, padded && { padding: 20 }]}>{children}</View>;

  return (
    <SafeAreaView style={s.screen} edges={edges}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function PageHeader({
  title, subtitle, back, right,
}: { title: string; subtitle?: string; back?: boolean; right?: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={s.header}>
      {back && (
        <Pressable onPress={() => router.back()} hitSlop={12} style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={s.headerSub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, onPress, delay }: {
  children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; delay?: number;
}) {
  const body = onPress ? (
    <Pressable
      onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.card, style, pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 }]}
    >
      {children}
    </Pressable>
  ) : <View style={[s.card, style]}>{children}</View>;
  if (delay === undefined) return body;
  return <Animated.View entering={FadeInDown.delay(Math.min(delay, 8) * 50).duration(350)}>{body}</Animated.View>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label, onPress, variant = 'primary', icon, loading, disabled, style, small,
}: {
  label: string; onPress: () => void; variant?: ButtonVariant; icon?: IconName;
  loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>; small?: boolean;
}) {
  const v = buttonVariants[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={() => { if (isDisabled) return; tap(); onPress(); }}
      style={({ pressed }) => [
        s.btn, small && s.btnSmall, { backgroundColor: v.bg, borderColor: v.border },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        isDisabled && { opacity: 0.5 }, style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : (
        <>
          {icon && <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} />}
          <Text style={[s.btnText, small && { fontSize: 13 }, { color: v.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.ink, fg: colors.white, border: colors.ink },
  secondary: { bg: colors.surface, fg: colors.ink, border: colors.border },
  ghost: { bg: 'transparent', fg: colors.goldDark, border: 'transparent' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.dangerSoft },
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const st = statusColors[status] ?? statusColors.due;
  return (
    <View style={[s.badge, { backgroundColor: st.bg }]}>
      <Ionicons name={st.icon as IconName} size={12} color={st.fg} />
      <Text style={[s.badgeText, { color: st.fg }]}>{st.label}</Text>
    </View>
  );
}

export function Pill({ label, color = colors.muted, bg = colors.surfaceAlt }: { label: string; color?: string; bg?: string }) {
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function Avatar({ name, base64, size = 40 }: { name: string; base64?: string | null; size?: number }) {
  const initials = name.trim().split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  if (base64) {
    return <Image source={{ uri: `data:image/jpeg;base64,${base64}` }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.goldDark, fontWeight: '800', fontSize: size * 0.36 }}>{initials || '?'}</Text>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => { tap(); onChange(o.value); }}
            style={[s.chip, active && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
            <Text style={[s.chipText, active && { color: colors.white }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function Field({ label, icon, suffix, hint, ...props }: TextInputProps & {
  label: string; icon?: IconName; suffix?: string; hint?: string;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldWrap}>
        {icon && <Ionicons name={icon} size={18} color={colors.subtle} style={{ marginRight: 10 }} />}
        <TextInput placeholderTextColor={colors.subtle} style={s.fieldInput} {...props} />
        {!!suffix && <Text style={s.fieldSuffix}>{suffix}</Text>}
      </View>
      {!!hint && <Text style={s.fieldHint}>{hint}</Text>}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {!!action && (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={s.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function EmptyState({ icon, title, text, action, onAction }: {
  icon: IconName; title: string; text?: string; action?: string; onAction?: () => void;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={28} color={colors.goldDark} /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      {!!text && <Text style={s.emptyText}>{text}</Text>}
      {!!action && onAction && <Button label={action} onPress={onAction} style={{ marginTop: 16, alignSelf: 'stretch' }} />}
    </View>
  );
}

export function ProgressBar({ value, color = colors.gold, track }: { value: number; color?: string; track?: string }) {
  return (
    <View style={[s.progressTrack, track ? { backgroundColor: track } : null]}>
      <View style={[s.progressFill, { width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`, backgroundColor: color }]} />
    </View>
  );
}

export function ListRow({ icon, label, detail, onPress, danger, last }: {
  icon: IconName; label: string; detail?: string; onPress: () => void; danger?: boolean; last?: boolean;
}) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }}
      style={({ pressed }) => [s.listRow, !last && s.listRowBorder, pressed && { backgroundColor: colors.surfaceAlt }]}>
      <View style={[s.listIcon, danger && { backgroundColor: colors.dangerSoft }]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.ink} />
      </View>
      <Text style={[s.listLabel, danger && { color: colors.danger }]}>{label}</Text>
      {!!detail && <Text style={s.listDetail}>{detail}</Text>}
      <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
    </Pressable>
  );
}

export function Loading() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}><ActivityIndicator color={colors.gold} /></View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.3 },
  headerSub: { fontSize: 13, color: colors.muted, marginTop: 2 },

  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card },

  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 18, borderWidth: 1 },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm },
  btnText: { fontSize: 15, fontWeight: '700' },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },

  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.muted },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.ink, marginBottom: 8 },
  fieldWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14 },
  fieldInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.ink },
  fieldSuffix: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  fieldHint: { fontSize: 12, color: colors.subtle, marginTop: 6 },

  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.ink },
  sectionAction: { fontSize: 13, fontWeight: '700', color: colors.goldDark },

  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.goldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 },

  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 4 },
  listRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  listIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  listLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.ink },
  listDetail: { fontSize: 13, color: colors.muted },
});
