// app/[bo]/overview.tsx — Tableau de bord admin : KPIs, courbes, répartition, revenus récents.
// Données protégées côté serveur (403 pour un non-admin).
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, fcfa } from '@/src/theme';
import { Screen, PageHeader, Card, Segmented, SectionTitle, ListRow, Loading, EmptyState, tap } from '@/src/components/ui';
import * as adminApi from '@/src/api/admin';
import { ApiError, backofficeKey as bo } from '@/src/api/client';

type Period = '7' | '30' | '90';
const MARK = colors.goldDark; // #8F6F1E : contraste suffisant sur blanc (le doré clair ne l'est pas)

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Actives', PENDING: 'En recrutement', COMPLETED: 'Terminées', CANCELLED: 'Annulées',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: colors.success, PENDING: colors.warning, COMPLETED: colors.info, CANCELLED: colors.subtle,
};

const shortDate = (iso: string) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};
const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace('.0', '')} M` : n >= 1000 ? `${Math.round(n / 1000)} k` : `${n}`;

function Delta({ kpi }: { kpi: adminApi.Kpi }) {
  const { value, previous } = kpi;
  if (previous === 0 && value === 0) return <Text style={s.deltaFlat}>—</Text>;
  if (previous === 0) return <Text style={[s.delta, { color: colors.success }]}>▲ nouveau</Text>;
  const pct = Math.round(((value - previous) / previous) * 100);
  const up = pct >= 0;
  return (
    <Text style={[s.delta, { color: pct === 0 ? colors.muted : up ? colors.success : colors.danger }]}>
      {pct === 0 ? '=' : up ? '▲' : '▼'} {Math.abs(pct)} %
    </Text>
  );
}

function StatTile({ label, value, kpi, icon }: { label: string; value: string; kpi: adminApi.Kpi; icon: any }) {
  return (
    <View style={s.tile}>
      <View style={s.tileHead}>
        <Ionicons name={icon} size={15} color={colors.muted} />
        <Text style={s.tileLabel} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={s.tileValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Delta kpi={kpi} />
        <Text style={s.tileVs}>vs période préc.</Text>
      </View>
    </View>
  );
}

// Histogramme journalier, une seule teinte, survol/appui = info-bulle.
function ColumnChart({ title, total, data, format }: {
  title: string; total: string; data: adminApi.DayPoint[]; format: (n: number) => string;
}) {
  const [w, setW] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const H = 120;
  const max = Math.max(1, ...data.map((d) => d.value));
  const gap = data.length > 40 ? 1 : 2;
  const bw = w > 0 ? Math.max(1, (w - gap * (data.length - 1)) / data.length) : 0;
  const active = sel != null ? data[sel] : null;
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <Card style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={s.chartTitle}>{title}</Text>
          <Text style={s.chartTotal}>{active ? format(active.value) : total}</Text>
          <Text style={s.chartHint}>{active ? `le ${shortDate(active.day)}` : 'sur la période'}</Text>
        </View>
        <Text style={s.axisMax}>max {format(max)}</Text>
      </View>
      <View onLayout={onLayout} style={{ height: H, marginTop: 10, flexDirection: 'row', alignItems: 'flex-end' }}>
        {/* ligne de base discrète */}
        <View style={s.baseline} />
        {bw > 0 && data.map((d, i) => {
          const h = d.value > 0 ? Math.max(3, (d.value / max) * (H - 6)) : 0;
          const on = sel === i;
          return (
            <Pressable
              key={d.day}
              onHoverIn={() => setSel(i)} onHoverOut={() => setSel(null)}
              onPressIn={() => setSel(i)} onPressOut={() => setTimeout(() => setSel(null), 1500)}
              style={{ width: bw, height: H, marginRight: i < data.length - 1 ? gap : 0, justifyContent: 'flex-end' }}
            >
              <View style={{
                height: h, backgroundColor: MARK, opacity: sel == null || on ? 1 : 0.35,
                borderTopLeftRadius: Math.min(4, bw / 2), borderTopRightRadius: Math.min(4, bw / 2),
              }} />
            </Pressable>
          );
        })}
      </View>
      {data.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
          <Text style={s.axis}>{shortDate(data[0].day)}</Text>
          <Text style={s.axis}>{shortDate(data[data.length - 1].day)}</Text>
        </View>
      )}
    </Card>
  );
}

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus);
  const total = entries.reduce((a, [, v]) => a + v, 0);
  return (
    <Card style={{ marginBottom: 14 }}>
      <Text style={s.chartTitle}>Tontines par statut</Text>
      <Text style={s.chartTotal}>{total}</Text>
      <View style={s.stack}>
        {total > 0 && entries.filter(([, v]) => v > 0).map(([k, v], i, arr) => (
          <View key={k} style={{ flex: v, backgroundColor: STATUS_COLOR[k] ?? colors.muted, marginRight: i < arr.length - 1 ? 2 : 0 }} />
        ))}
      </View>
      <View style={{ gap: 8, marginTop: 12 }}>
        {entries.map(([k, v]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.dot, { backgroundColor: STATUS_COLOR[k] ?? colors.muted }]} />
            <Text style={s.legend}>{STATUS_LABEL[k] ?? k}</Text>
            <Text style={s.legendVal}>{v}{total > 0 ? `  ·  ${Math.round((v / total) * 100)} %` : ''}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

export default function AdminOverviewScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('30');
  const [data, setData] = useState<adminApi.Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: Period) => {
    try {
      setError(null);
      setData(await adminApi.analytics(Number(p) as 7 | 30 | 90));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger le tableau de bord.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(period); }, [load, period]));

  const sum = (pts: adminApi.DayPoint[]) => pts.reduce((a, b) => a + b.value, 0);

  return (
    <Screen refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(period); }}>
      <PageHeader back title="Tableau de bord" subtitle="Pilotage de SèneTontine" />

      <View style={{ marginBottom: 16 }}>
        <Segmented<Period>
          value={period}
          onChange={(p) => { setPeriod(p); setLoading(!data); }}
          options={[{ value: '7', label: '7 jours' }, { value: '30', label: '30 jours' }, { value: '90', label: '90 jours' }]}
        />
      </View>

      {loading && !data ? <Loading /> : error && !data ? (
        <EmptyState icon="alert-circle-outline" title="Erreur" text={error} action="Réessayer" onAction={() => load(period)} />
      ) : data ? (
        <Animated.View entering={FadeInDown.duration(300)}>
          {/* Alertes à traiter */}
          {(data.openIncidents > 0 || data.pendingDeclarations > 0) && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {data.openIncidents > 0 && (
                <Pressable style={[s.alert, { backgroundColor: colors.dangerSoft }]} onPress={() => { tap(); router.push(`/${bo()}/incidents` as any); }}>
                  <Ionicons name="warning-outline" size={18} color={colors.danger} />
                  <Text style={[s.alertText, { color: colors.danger }]}>{data.openIncidents} signalement{data.openIncidents > 1 ? 's' : ''} ouvert{data.openIncidents > 1 ? 's' : ''}</Text>
                </Pressable>
              )}
              {data.pendingDeclarations > 0 && (
                <View style={[s.alert, { backgroundColor: colors.warningSoft }]}>
                  <Ionicons name="time-outline" size={18} color={colors.warning} />
                  <Text style={[s.alertText, { color: colors.warning }]}>{data.pendingDeclarations} paiement{data.pendingDeclarations > 1 ? 's' : ''} à confirmer</Text>
                </View>
              )}
            </View>
          )}

          <View style={s.grid}>
            <StatTile icon="cash-outline" label="Revenus NabooPay" value={fcfa(data.revenue.value)} kpi={data.revenue} />
            <StatTile icon="person-add-outline" label="Inscriptions" value={`${data.signups.value}`} kpi={data.signups} />
            <StatTile icon="people-outline" label="Tontines créées" value={`${data.tontinesCreated.value}`} kpi={data.tontinesCreated} />
            <StatTile icon="swap-horizontal-outline" label="Cotisations confirmées" value={`${compact(data.cotisationsVolume.value)} F`} kpi={data.cotisationsVolume} />
          </View>
          <Text style={s.footnote}>{data.totalUsers} utilisateurs au total</Text>

          <SectionTitle title="Évolution" />
          <ColumnChart title="Revenus par jour" total={fcfa(sum(data.revenueSeries))} data={data.revenueSeries} format={(n) => fcfa(n)} />
          <ColumnChart title="Nouveaux inscrits" total={`${sum(data.signupSeries)}`} data={data.signupSeries} format={(n) => `${n}`} />
          <ColumnChart title="Tontines créées" total={`${sum(data.tontineSeries)}`} data={data.tontineSeries} format={(n) => `${n}`} />
          <ColumnChart title="Volume des cotisations" total={fcfa(sum(data.cotisationSeries))} data={data.cotisationSeries} format={(n) => fcfa(n)} />

          <StatusBreakdown byStatus={data.tontinesByStatus} />

          <SectionTitle title="Derniers revenus" />
          <Card style={{ marginBottom: 14, paddingVertical: 4 }}>
            {data.recentRevenue.length === 0 ? (
              <Text style={[s.legend, { paddingVertical: 14, color: colors.muted }]}>Aucun paiement NabooPay pour l’instant.</Text>
            ) : data.recentRevenue.map((r, i) => (
              <View key={r.id} style={[s.payRow, i < data.recentRevenue.length - 1 && s.payBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.payName} numberOfLines={1}>{r.userName}</Text>
                  <Text style={s.payMeta}>{r.purpose === 'RENEW' ? 'Renouvellement' : 'Nouvelle tontine'} · {new Date(r.paidAt).toLocaleDateString('fr-FR')}</Text>
                </View>
                <Text style={s.payAmount}>{fcfa(r.amount)}</Text>
              </View>
            ))}
          </Card>

          <SectionTitle title="Gestion" />
          <Card style={{ paddingVertical: 4 }}>
            <ListRow icon="people-circle-outline" label="Utilisateurs" onPress={() => router.push(`/${bo()}/users` as any)} />
            <ListRow icon="albums-outline" label="Tontines" onPress={() => router.push(`/${bo()}/tontines` as any)} />
            <ListRow icon="flag-outline" label="Signalements" detail={data.openIncidents ? `${data.openIncidents}` : undefined} onPress={() => router.push(`/${bo()}/incidents` as any)} />
            <ListRow icon="megaphone-outline" label="Annonce à tous" onPress={() => router.push(`/${bo()}/broadcast` as any)} />
            <ListRow icon="document-text-outline" label="Journal d’audit" onPress={() => router.push(`/${bo()}/audit-logs` as any)} last />
          </Card>
        </Animated.View>
      ) : null}
    </Screen>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    flexGrow: 1, flexBasis: '46%', backgroundColor: colors.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  tileHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tileLabel: { fontSize: 12, color: colors.muted, flex: 1 },
  tileValue: { fontSize: 22, fontWeight: '800', color: colors.ink },
  tileVs: { fontSize: 11, color: colors.subtle },
  delta: { fontSize: 12, fontWeight: '700' },
  deltaFlat: { fontSize: 12, color: colors.subtle },
  footnote: { fontSize: 12, color: colors.muted, marginTop: 8, marginBottom: 6 },
  chartTitle: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  chartTotal: { fontSize: 22, fontWeight: '800', color: colors.ink, marginTop: 2 },
  chartHint: { fontSize: 11, color: colors.subtle },
  axisMax: { fontSize: 11, color: colors.subtle },
  axis: { fontSize: 11, color: colors.subtle },
  baseline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, backgroundColor: colors.border },
  stack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 10, backgroundColor: colors.surfaceAlt },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legend: { fontSize: 14, color: colors.ink, flex: 1 },
  legendVal: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  alert: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14 },
  alertText: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  payRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  payBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  payName: { fontSize: 14, fontWeight: '600', color: colors.ink },
  payMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  payAmount: { fontSize: 14, fontWeight: '800', color: colors.ink },
});
