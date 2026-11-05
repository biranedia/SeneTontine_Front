// app/[bo]/health.tsx — Supervision du serveur : statut, DB, maintenance, redéploiement.
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as adminApi from '@/src/api/admin';
import { ApiError } from '@/src/api/client';
import { ABtn, ACard, AdminPage, ErrorBox, Loader, fmtDateTime, st } from '@/src/components/admin/AdminUI';
import { colors } from '@/src/theme';

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={[st.row, { paddingVertical: 10 }]}>
      <Text style={{ fontSize: 14, color: colors.muted, flex: 1 }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '700', color: valueColor ?? colors.ink }}>{value}</Text>
    </View>
  );
}

function StatusDot({ up }: { up: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: up ? colors.success : colors.danger }} />
      <Text style={{ fontSize: 14, fontWeight: '700', color: up ? colors.success : colors.danger }}>
        {up ? 'En ligne' : 'Hors ligne'}
      </Text>
    </View>
  );
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 24) return `${Math.floor(h / 24)}j ${h % 24}h`;
  return `${h}h ${m}min`;
}

export default function AdminHealthScreen() {
  const [data, setData] = useState<adminApi.ServerHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setError(null);
      const h = await adminApi.serverHealth();
      setData(h);
      setMaintenanceMsg(h.maintenanceMessage);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de charger la santé du serveur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleMaintenance = async (value: boolean) => {
    if (!data) return;
    const verb = value ? 'activer' : 'désactiver';
    Alert.alert(
      `${value ? 'Activer' : 'Désactiver'} la maintenance ?`,
      value
        ? "Les membres ne pourront plus accéder à l'application. L'espace admin reste accessible."
        : "L'application sera de nouveau accessible à tous les membres.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: value ? 'Activer' : 'Désactiver',
          style: value ? 'destructive' : 'default',
          onPress: async () => {
            setBusy('maintenance');
            try {
              const result = await adminApi.setMaintenance(value, maintenanceMsg || undefined);
              setData((prev) => prev ? { ...prev, maintenanceEnabled: result.enabled, maintenanceMessage: result.message } : prev);
            } catch (e) {
              Alert.alert('Erreur', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  const triggerRedeploy = () => {
    Alert.alert(
      'Redéployer le serveur ?',
      'Render va relancer un nouveau déploiement depuis le dernier commit. Le serveur sera indisponible ~1 min.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Redéployer',
          onPress: async () => {
            setBusy('deploy');
            try {
              await adminApi.redeploy();
              Alert.alert('Redéploiement lancé', 'Le serveur va redémarrer dans quelques secondes. Vérifie sur Render Dashboard.');
            } catch (e) {
              Alert.alert('Échec', e instanceof ApiError ? e.message : 'Réessaie plus tard.');
            } finally {
              setBusy(null);
            }
          },
        },
      ]
    );
  };

  return (
    <AdminPage
      title="Santé serveur"
      subtitle="Supervision en temps réel · SèneTontine API"
      onRefresh={() => { setLoading(true); load(); }}
    >
      {loading ? <Loader /> : error ? <ErrorBox text={error} onRetry={load} /> : data ? (
        <>
          {/* Statut global */}
          <ACard style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[st.section, { marginTop: 0, marginBottom: 0 }]}>Serveur API</Text>
              <StatusDot up={data.dbUp} />
            </View>
            <Row label="Uptime" value={formatUptime(data.uptimeSeconds)} valueColor={colors.success} />
            <Row label="Démarré le" value={fmtDateTime(data.serverStartedAt)} />
            <Row label="Mémoire JVM" value={`${data.heapUsedMb} Mo / ${data.heapMaxMb} Mo`} />
          </ACard>

          {/* Base de données */}
          <ACard style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[st.section, { marginTop: 0, marginBottom: 0 }]}>Base Neon (PostgreSQL)</Text>
              <StatusDot up={data.dbUp} />
            </View>
            <Row label="Connexions actives" value={`${data.dbPoolActive} / ${data.dbPoolMax}`} />
            <Row label="Connexions en attente" value={`${data.dbPoolPending}`} valueColor={data.dbPoolPending > 0 ? colors.warning : undefined} />
            <Row label="Connexions libres" value={`${data.dbPoolIdle}`} />
            <Row label="Dernière migration" value={data.lastMigration} />
          </ACard>

          {/* Mode maintenance */}
          <ACard style={{ marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={[st.section, { marginTop: 0, marginBottom: 2 }]}>Mode maintenance</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  Bloque l'accès à l'appli pour les membres (l'admin reste accessible).
                </Text>
              </View>
              <Switch
                value={data.maintenanceEnabled}
                onValueChange={toggleMaintenance}
                disabled={busy === 'maintenance'}
                trackColor={{ true: colors.warning, false: colors.border }}
                thumbColor={data.maintenanceEnabled ? colors.goldDark : colors.muted}
              />
            </View>
            {data.maintenanceEnabled && (
              <View style={{ marginTop: 8, padding: 12, backgroundColor: colors.warningSoft, borderRadius: 10 }}>
                <Text style={{ fontSize: 13, color: colors.warning, fontWeight: '700' }}>
                  ⚠ Maintenance active — les membres voient ce message :
                </Text>
                <Text style={{ fontSize: 13, color: colors.ink, marginTop: 4 }}>
                  {data.maintenanceMessage}
                </Text>
              </View>
            )}
          </ACard>

          {/* Actions */}
          <ACard style={{ marginBottom: 14 }}>
            <Text style={[st.section, { marginTop: 0, marginBottom: 12 }]}>Actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <ABtn
                icon="refresh-circle-outline"
                label="Rafraîchir les métriques"
                onPress={() => { setLoading(true); load(); }}
              />
              {data.deployHookConfigured && (
                <ABtn
                  icon="rocket-outline"
                  label="Redéployer sur Render"
                  tone="primary"
                  busy={busy === 'deploy'}
                  onPress={triggerRedeploy}
                />
              )}
              {!data.deployHookConfigured && Platform.OS === 'web' && (
                <Text style={{ fontSize: 12, color: colors.muted, alignSelf: 'center' }}>
                  Configure RENDER_DEPLOY_HOOK_URL dans les variables d'environnement Render pour activer le redéploiement.
                </Text>
              )}
            </View>
          </ACard>
        </>
      ) : null}
    </AdminPage>
  );
}
