// Home, terminal style: prompt header, latest score, findings as block
// bars, the next fix to do, quick commands and scan history.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RiskScoreCard from '../components/RiskScoreCard';
import {
  Card, DemoBadge, EmptyState, Mono, Screen, SectionHeader, T, timeAgo,
} from '../components/ui';
import { font, mono, space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import { useScans } from '../state/scanStore';
import { CATEGORY_COPY } from '../utils/riskScoring';

function handleFrom(profile, user) {
  const raw = profile?.first_name || user?.email?.split('@')[0] || 'user';
  return raw.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'user';
}

function PromptHeader({ handle, onProfile }) {
  const { colors } = useTheme();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setOn((v) => !v), 530);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.header}>
      <Text style={{ fontFamily: mono, fontSize: 14, color: colors.primary, flex: 1 }} numberOfLines={1}>
        {handle}@cybertrace:~$<Text style={{ opacity: on ? 1 : 0 }}> █</Text>
      </Text>
      <Pressable onPress={onProfile} hitSlop={8} style={styles.online} accessibilityLabel="Open profile">
        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        <Mono size={12} color={colors.textMuted}>online</Mono>
      </Pressable>
    </View>
  );
}

// One line per category: name ····· ██████ 2
function FindingsBars({ scan }) {
  const { colors } = useTheme();
  const tone = {
    DATA_BREACH: colors.risk.CRITICAL.fg,
    SOCIAL_MEDIA: colors.risk.MEDIUM.fg,
    PUBLIC_RECORD: colors.skyInk,
  };
  const rows = Object.entries(CATEGORY_COPY).map(([key, c]) => ({
    key, label: c.label.toLowerCase(), n: scan.results.filter((r) => r.category === key).length,
  }));
  return (
    <Card style={{ gap: 6 }}>
      {rows.map((r) => (
        <View key={r.key} style={styles.barRow}>
          <Mono size={13} color={colors.textMuted} style={{ width: 120 }}>{r.label}</Mono>
          <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
            {r.n === 0 ? <Mono size={13} color={colors.textMuted}>·</Mono> : Array.from({ length: Math.min(r.n * 3, 12) }, (_, i) => (
              <View key={i} style={{ width: 7, height: 12, borderRadius: 1, backgroundColor: tone[r.key] }} />
            ))}
          </View>
          <Mono size={13} color={r.n ? tone[r.key] : colors.textMuted} style={{ width: 20, textAlign: 'right' }}>{r.n}</Mono>
        </View>
      ))}
    </Card>
  );
}

function Command({ icon, label, onPress }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.command, { borderColor: colors.border, backgroundColor: colors.card }, pressed && { borderColor: colors.primary }]}
    >
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Mono size={12}>{label}</Mono>
    </Pressable>
  );
}

export function ScanRow({ scan, onPress, last }) {
  const { colors } = useTheme();
  const risk = colors.risk[scan.risk_level];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.scanRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Mono size={13} numberOfLines={1}>{scan.identifier}</Mono>
        <Mono size={11} color={colors.textMuted}>{timeAgo(scan.created_at)} · {scan.results.length} findings</Mono>
      </View>
      <Text style={{ fontFamily: font.bold, fontSize: 18, color: risk.fg }}>{scan.risk_score}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </Pressable>
  );
}

export default function UserDashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const { profile, user } = useAuth();
  const { scans, latest } = useScans();
  const handle = handleFrom(profile, user);

  const openTips = latest ? latest.recommendations.filter((t) => !latest.completedTips.includes(t.key)) : [];

  return (
    <Screen>
      <PromptHeader handle={handle} onProfile={() => navigation.navigate('Profile')} />

      {latest ? (
        <RiskScoreCard
          scan={latest}
          title="last_scan"
          onPress={() => navigation.navigate('AnalysisResults', { scanId: latest.scan_id })}
          footer={(
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Mono size={11} color={colors.textMuted}>scanned {timeAgo(latest.created_at)}</Mono>
              {latest.demo ? <DemoBadge /> : null}
            </View>
          )}
        />
      ) : (
        <EmptyState
          icon="finger-print"
          title="No scans yet"
          text="Run your first scan to see what’s publicly out there about you."
          actionLabel="Start a scan"
          onAction={() => navigation.navigate('Scan')}
        />
      )}

      {latest ? (
        <>
          <SectionHeader title="Findings" actionLabel="details" onAction={() => navigation.navigate('AnalysisResults', { scanId: latest.scan_id })} />
          <FindingsBars scan={latest} />

          {openTips.length > 0 ? (
            <Card highlight onPress={() => navigation.navigate('Tips')} style={[styles.fix, { marginTop: space.md }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <T variant="bodyMedium">
                  {openTips.length} {openTips.length === 1 ? 'fix' : 'fixes'} waiting
                </T>
                <T variant="small" color={colors.textMuted} numberOfLines={1}>Next: {openTips[0].title}</T>
              </View>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </Card>
          ) : (
            <Card style={[styles.fix, { marginTop: space.md }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <T variant="small" style={{ flex: 1 }}>All fixes done for this scan. Nice work.</T>
            </Card>
          )}
        </>
      ) : null}

      <SectionHeader title="Commands" />
      <View style={styles.commands}>
        <Command icon="scan" label="new_scan" onPress={() => navigation.navigate('Scan')} />
        <Command icon="time-outline" label="history" onPress={() => navigation.navigate('History')} />
        <Command icon="bulb-outline" label="tips" onPress={() => navigation.navigate('Tips')} />
      </View>

      {scans.length ? (
        <>
          <SectionHeader
            title="History"
            actionLabel={scans.length > 3 ? 'see all' : undefined}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm, marginBottom: space.lg },
  online: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm,
    marginTop: 2, paddingTop: space.sm + 2, borderTopWidth: StyleSheet.hairlineWidth,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fix: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  commands: { flexDirection: 'row', gap: 8 },
  command: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderRadius: 12, paddingVertical: 14,
  },
  scanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
