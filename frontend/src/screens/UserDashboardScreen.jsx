// Home: latest risk score, quick actions, category totals and recent scans.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RiskScoreCard from '../components/RiskScoreCard';
import {
  Card, DemoBadge, EmptyState, IconBubble, Muted, RiskBadge, Screen, SectionHeader, T, timeAgo,
} from '../components/ui';
import { font, radius, space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import { useScans } from '../state/scanStore';
import { CATEGORY_COPY } from '../utils/riskScoring';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function QuickAction({ icon, label, tone, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quick, { backgroundColor: colors[tone] }, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
    >
      <View style={[styles.quickIcon, { backgroundColor: colors.card }]}>
        <Ionicons name={icon} size={18} color={colors[`${tone}Ink`]} />
      </View>
      <Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function ScanRow({ scan, onPress, last }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.scanRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.scoreChip, { backgroundColor: colors.risk[scan.risk_level].bg }]}>
        <Text style={{ fontFamily: font.bold, fontSize: 16, color: colors.risk[scan.risk_level].fg }}>{scan.risk_score}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <T variant="bodyMedium" numberOfLines={1}>{scan.identifier}</T>
        <Muted variant="caption">{timeAgo(scan.created_at)} · {scan.results.length} findings</Muted>
      </View>
      <RiskBadge level={scan.risk_level} />
    </Pressable>
  );
}

export default function UserDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, user } = useAuth();
  const { scans, latest } = useScans();
  const name = profile?.first_name || user?.email?.split('@')[0] || 'there';
  const initial = name.charAt(0).toUpperCase();

  const counts = latest
    ? Object.keys(CATEGORY_COPY).map((k) => ({ key: k, ...CATEGORY_COPY[k], n: latest.results.filter((r) => r.category === k).length }))
    : [];
  const openTips = latest ? latest.recommendations.length - latest.completedTips.length : 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Muted>{greeting()},</Muted>
          <T variant="h1">{name}</T>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Profile')}
          style={[styles.avatar, { backgroundColor: colors.lavender }]}
          accessibilityLabel="Open profile"
        >
          <Text style={{ fontFamily: font.bold, fontSize: 18, color: colors.lavenderInk }}>{initial}</Text>
        </Pressable>
      </View>

      {latest ? (
        <RiskScoreCard
          scan={latest}
          title="Latest risk score"
          onPress={() => navigation.navigate('AnalysisResults', { scanId: latest.scan_id })}
          footer={(
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Muted variant="caption">Scanned {timeAgo(latest.created_at)} · {latest.identifier}</Muted>
              {latest.demo ? <DemoBadge /> : null}
            </View>
          )}
        />
      ) : (
        <EmptyState
          icon="finger-print"
          title="Run your first scan"
          text="Enter your email or a username and we’ll show what’s publicly out there about you."
          actionLabel="Start a scan"
          onAction={() => navigation.navigate('Scan')}
        />
      )}

      <SectionHeader title="Quick actions" />
      <View style={styles.quickRow}>
        <QuickAction icon="scan" label="New scan" tone="lavender" onPress={() => navigation.navigate('Scan')} />
        <QuickAction icon="time" label="History" tone="peach" onPress={() => navigation.navigate('History')} />
        <QuickAction icon="bulb" label="Tips" tone="mint" onPress={() => navigation.navigate('Tips')} />
      </View>

      {latest ? (
        <>
          <SectionHeader title="What we found" />
          <View style={styles.statRow}>
            {counts.map((c) => (
              <Card key={c.key} style={styles.stat}>
                <IconBubble icon={c.icon} tone={c.tone} size={36} />
                <T variant="h2" style={{ marginTop: space.sm }}>{c.n}</T>
                <Muted variant="caption">{c.label}</Muted>
              </Card>
            ))}
          </View>

          {openTips > 0 ? (
            <Card tone="primary" onPress={() => navigation.navigate('Tips')} style={styles.alert}>
              <View style={[styles.alertIcon, { backgroundColor: colors.lime }]}>
                <Ionicons name="bulb" size={20} color={colors.onLime} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertTitle, { color: colors.onPrimary }]}>
                  {openTips} {openTips === 1 ? 'tip' : 'tips'} to lower your risk
                </Text>
                <Text style={[styles.alertText, { color: colors.onPrimaryMuted }]}>Start with the highest priority one</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.onPrimary} />
            </Card>
          ) : null}

          <SectionHeader
            title="Recent scans"
            actionLabel={scans.length > 3 ? 'See all' : undefined}
            onAction={() => navigation.navigate('History')}
          />
          <Card style={{ paddingVertical: 4 }}>
            {scans.slice(0, 3).map((s, i, arr) => (
              <ScanRow
                key={s.scan_id}
                scan={s}
                last={i === arr.length - 1}
                onPress={() => navigation.navigate('AnalysisResults', { scanId: s.scan_id })}
              />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg, marginTop: space.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm,
    marginTop: space.md, paddingTop: space.md - 4, borderTopWidth: StyleSheet.hairlineWidth,
  },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: { flex: 1, borderRadius: radius.tile, padding: 14, gap: 18, minHeight: 104 },
  quickIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontFamily: font.semibold, fontSize: 14 },
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 14 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: space.md },
  alertIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontFamily: font.semibold, fontSize: 16 },
  alertText: { fontFamily: font.regular, fontSize: 13, marginTop: 2 },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  scoreChip: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
