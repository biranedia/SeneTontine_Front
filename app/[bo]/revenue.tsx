// app/[bo]/revenue.tsx — Revenus : paiements NabooPay des créateurs et créations offertes.
import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';
import { fcfa } from '@/src/theme';
import { ACard, AdminPage, Badge, Chips, Empty, ErrorBox, Loader, Stat, fmtDateTime, st } from '@/src/components/admin/AdminUI';

type Filter = 'ALL' | 'PAID' | 'PENDING' | 'GIFT';

export default function AdminRevenueScreen() {
  const [items, setItems] = useState<adminApi.RevenueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = useCallback(async () => {
    try {
      setError(null);
      setItems(await adminApi.revenue());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger les revenus.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isGift = (r: adminApi.RevenueItem) => r.orderId?.startsWith('GIFT-');
  const paid = items.filter((r) => r.status === 'PAID' && !isGift(r));
  const total = paid.reduce((s, r) => s + r.amount, 0);
  const month = paid.filter((r) => r.paidAt && new Date(r.paidAt).getMonth() === new Date().getMonth()
    && new Date(r.paidAt).getFullYear() === new Date().getFullYear()).reduce((s, r) => s + r.amount, 0);

  const visible = useMemo(() => items.filter((r) =>
    filter === 'ALL' || (filter === 'GIFT' ? isGift(r) : r.status === filter && !isGift(r))), [items, filter]);

  return (
    <AdminPage title="Revenus" subtitle="Paiements NabooPay des créateurs (2 500 F par création ou renouvellement)"
      onRefresh={() => { setLoading(true); load(); }}>
      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={load} /> : (
        <>
          <View style={st.grid}>
            <Stat icon="cash-outline" label="Total encaissé" value={fcfa(total)} />
            <Stat icon="calendar-outline" label="Ce mois-ci" value={fcfa(month)} />
            <Stat icon="checkmark-done-outline" label="Paiements réussis" value={String(paid.length)} />
            <Stat icon="gift-outline" label="Créations offertes" value={String(items.filter(isGift).length)} />
          </View>
          <View style={{ marginBottom: 14 }}>
            <Chips value={filter} onChange={setFilter} options={[
              { value: 'ALL', label: 'Tout' }, { value: 'PAID', label: 'Payés' },
              { value: 'PENDING', label: 'En attente' }, { value: 'GIFT', label: 'Offerts' },
            ]} />
          </View>
          <ACard style={{ paddingVertical: 4 }}>
            {visible.length === 0 ? <Empty text="Aucun paiement pour l’instant." /> : visible.map((r, i) => (
              <View key={r.id} style={[st.row, { flexWrap: 'wrap' }, i === visible.length - 1 && st.rowLast]}>
                <View style={{ flex: 1, minWidth: 200 }}>
                  <Text style={st.name}>{r.userName} <Text style={st.meta}>· {r.userPhone}</Text></Text>
                  <Text style={st.meta}>
                    {r.purpose === 'RENEW' ? 'Renouvellement' : 'Nouvelle tontine'}{r.tontineName ? ` · ${r.tontineName}` : ''} · {fmtDateTime(r.paidAt ?? r.createdAt)}
                    {r.consumed ? ' · utilisé' : r.status === 'PAID' ? ' · pas encore utilisé' : ''}
                  </Text>
                </View>
                <Text style={[st.name, { marginRight: 6 }]}>{fcfa(r.amount)}</Text>
                {isGift(r) ? <Badge label="Offert" tone="gold" />
                  : <Badge label={r.status === 'PAID' ? 'Payé' : r.status === 'PENDING' ? 'En attente' : 'Annulé'}
                      tone={r.status === 'PAID' ? 'green' : r.status === 'PENDING' ? 'orange' : 'gray'} />}
              </View>
            ))}
          </ACard>
        </>
      )}
    </AdminPage>
  );
}
