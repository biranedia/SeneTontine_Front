// app/theme.ts — Design system SèneTontine : moderne, clair, accents dorés.
// Les anciens noms (deep, cream, earth...) sont conservés pour les écrans secondaires.
export const colors = {
  // Fonds
  bg: '#F7F5F0',
  surface: '#FFFFFF',
  surfaceAlt: '#FBFAF7',

  // Texte
  ink: '#1C1A17',
  muted: '#6B655C',
  subtle: '#A39C91',

  // Marque
  gold: '#C9A13B',
  goldDark: '#8F6F1E',
  goldSoft: '#F6EED8',
  goldLight: '#E2C36A',

  // États
  success: '#2E7D5B',
  successSoft: '#E4F2EA',
  warning: '#B26B12',
  warningSoft: '#FCF0DC',
  info: '#2F5FD0',
  infoSoft: '#E8EEFC',
  danger: '#C2362B',
  dangerSoft: '#FBE8E6',

  border: '#ECE7DD',
  white: '#FFFFFF',

  // Mobile money
  wave: '#1DC8F2',
  orange: '#FF7900',

  // Alias historiques (écrans admin / signalements)
  deep: '#1C1A17',
  deepAlt: '#2E2A24',
  cream: '#FFFFFF',
  goldPale: '#F6EED8',
  earth: '#6B655C',
  gray: '#A39C91',
  sage: '#2E7D5B',
  sageLight: '#4FA37D',
  error: '#C2362B',
  errorBg: '#FBE8E6',
  warnBg: '#FCF0DC',
  successBg: '#E4F2EA',
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

export const spacing = (n: number) => n * 4;

export const shadow = {
  card: {
    shadowColor: '#1C1A17',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  soft: {
    shadowColor: '#1C1A17',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
};

export const type = {
  hero: { fontSize: 28, fontWeight: '800' as const, color: colors.ink, letterSpacing: -0.5 },
  title: { fontSize: 22, fontWeight: '800' as const, color: colors.ink, letterSpacing: -0.3 },
  h2: { fontSize: 17, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 15, color: colors.ink },
  small: { fontSize: 13, color: colors.muted },
  tiny: { fontSize: 11, color: colors.subtle, fontWeight: '600' as const, letterSpacing: 0.6 },
};

// Statut d'une cotisation pour le tour en cours.
export type MemberStatus = 'due' | 'declared' | 'paid' | 'late';

export const statusColors: Record<MemberStatus, { bg: string; fg: string; label: string; icon: string }> = {
  due: { bg: colors.warningSoft, fg: colors.warning, label: 'À payer', icon: 'time-outline' },
  declared: { bg: colors.infoSoft, fg: colors.info, label: 'À confirmer', icon: 'hourglass-outline' },
  paid: { bg: colors.successSoft, fg: colors.success, label: 'Payé', icon: 'checkmark-circle' },
  late: { bg: colors.dangerSoft, fg: colors.danger, label: 'Payé en retard', icon: 'alert-circle' },
};

export function fcfa(n: number | null | undefined) {
  return `${Math.round(n ?? 0).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}
