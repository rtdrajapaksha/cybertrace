// Admin dashboard (report use case 3.2.3: monitor users and activity).
// Only reachable when users.role = 'admin'. Read-only for now.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  Banner, Button, Card, EmptyState, Field, IconBubble, IconButton, Muted, Pill, Screen, T, formatDate, timeAgo,
} from '../components/ui';
import { font, mono, space, useTheme } from '../theme/theme';
import { fetchAdminOverview } from '../services/adminService';

const ACTION_COPY = {
  SIGN_UP: { label: 'Signed up', icon: 'person-add', tone: 'mint' },
  LOGIN: { label: 'Logged in', icon: 'log-in', tone: 'sky' },
  SCAN_COMPLETED: { label: 'Finished a scan', icon: 'scan', tone: 'lavender' },
  SCAN_DELETED: { label: 'Deleted a scan', icon: 'trash', tone: 'peach' },
};

function Stat({ label, value, icon, tone }) {
  return (
    <Card style={styles.stat}>
      <IconBubble icon={icon} tone={tone} size={34} />
      <T variant="h2" style={{ marginTop: space.sm }}>{value}</T>
      <Muted variant="caption">{label}</Muted>
    </Card>
  );
}

export default function AdminDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setData(await fetchAdminOverview());
    } catch (e) {
      setError(e.message || 'Couldn’t load admin data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!data) return [];
    if (!q) return data.users;
    return data.users.filter((u) => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q));
  }, [data, query]);

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} label="Go back" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: mono, fontSize: 12, color: colors.primary }}>$ admin</Text>
          <T variant="h2">Admin dashboard</T>
        </View>
        <IconButton icon="refresh" onPress={load} label="Refresh" />
      </View>

      {error ? (
        <View style={{ gap: space.sm }}>
          <Banner tone="danger" icon="alert-circle" text={error} />
          <Button label="Try again" icon="refresh" variant="secondary" onPress={load} />
        </View>
      ) : null}

      {loading && !data ? (
        <View style={{ paddingVertical: space.xl * 2, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {data ? (
        <>
          <View style={styles.statRow}>
            <Stat label="Users" value={data.stats.totalUsers} icon="people" tone="lavender" />
            <Stat label="New this week" value={data.stats.newUsers} icon="person-add" tone="mint" />
          </View>
          <View style={[styles.statRow, { marginTop: 10 }]}>
            <Stat label="Scans saved" value={data.stats.totalScans} icon="scan" tone="sky" />
            <Stat label="Admins" value={data.stats.admins} icon="shield-checkmark" tone="peach" />
          </View>
          <Muted variant="caption" style={{ marginTop: space.sm }}>
            “Scans saved” counts the database only. Demo scans stay on each phone until the scanner backend is live.
          </Muted>

          <T variant="h3" style={styles.section}>Recent activity</T>
          {data.activity.length === 0 ? (
            <Card><Muted>No activity logged yet.</Muted></Card>
          ) : (
            <Card style={{ paddingVertical: 4 }}>
              {data.activity.map((a, i) => {
                const c = ACTION_COPY[a.action] || { label: a.action, icon: 'ellipse', tone: 'sky' };
                return (
                  <View key={a.log_id} style={[styles.row, i < data.activity.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                    <IconBubble icon={c.icon} tone={c.tone} size={34} />
                    <View style={{ flex: 1 }}>
                      <T variant="small" style={{ fontFamily: font.semibold }}>{c.label}</T>
                      <Muted variant="caption" numberOfLines={1}>{a.users?.email || 'deleted user'}</Muted>
                    </View>
                    <Muted variant="caption">{timeAgo(a.created_at)}</Muted>
                  </View>
                );
              })}
            </Card>
          )}

          <T variant="h3" style={styles.section}>Users</T>
          <Field icon="search" value={query} onChangeText={setQuery} placeholder="Search name or email" autoCapitalize="none" />
          <View style={{ gap: 8, marginTop: space.md }}>
            {users.length === 0 ? (
              <EmptyState icon="people" title="No matching users" text="Try a different name or email." />
            ) : users.map((u) => (
              <Card key={u.user_id} style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: colors.lavender }]}>
                  <Text style={{ fontFamily: font.bold, color: colors.lavenderInk }}>
                    {(u.first_name?.[0] || u.email[0]).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <T variant="bodyMedium" numberOfLines={1}>{`${u.first_name} ${u.last_name}`.trim() || u.email}</T>
                  <Muted variant="caption" numberOfLines={1}>{u.email} · joined {formatDate(u.created_at)}</Muted>
                </View>
                <View style={{ gap: 4, alignItems: 'flex-end' }}>
                  {u.role === 'admin' ? <Pill label="admin" fg={colors.peachInk} bg={colors.peach} /> : null}
                  <Pill label={u.plan} fg={colors.skyInk} bg={colors.sky} />
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: space.md },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 14 },
  section: { marginTop: space.lg, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
