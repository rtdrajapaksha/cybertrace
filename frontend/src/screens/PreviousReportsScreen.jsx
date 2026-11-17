// Scan history: newest first, with score trend, open and delete.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Card, ConfirmDialog, EmptyState, Muted, PageTitle, RiskBadge, Screen, T, formatDate,
} from '../components/ui';
import { font, radius, space, useTheme } from '../theme/theme';
import { useScans } from '../state/scanStore';

// Simple bar trend of the last few scores (oldest → newest).
function Trend({ scans }) {
  const { colors } = useTheme();
  const recent = scans.slice(0, 7).reverse();
  return (
    <View style={styles.trend}>
      {recent.map((s) => (
        <View key={s.scan_id} style={styles.barCol}>
          <View style={[styles.barTrack, { backgroundColor: colors.cardAlt }]}>
            <View style={[styles.bar, { height: `${Math.max(s.risk_score, 4)}%`, backgroundColor: colors.risk[s.risk_level].fg }]} />
          </View>
          <Text style={[styles.barLabel, { color: colors.textMuted }]}>{s.risk_score}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PreviousReportsScreen({ navigation }) {
  const { colors } = useTheme();
  const { scans } = useScans();
  const [toDelete, setToDelete] = useState(null);
  const { deleteScan } = useScans();

  const change = scans.length > 1 ? scans[0].risk_score - scans[1].risk_score : null;

  return (
    <Screen>
      <PageTitle prompt="history" title="Scan history" subtitle={`${scans.length} ${scans.length === 1 ? 'scan' : 'scans'} saved`} />

      {scans.length === 0 ? (
        <EmptyState
          icon="time"
          title="No scans yet"
          text="Your past scans will show up here so you can track your risk over time."
          actionLabel="Start a scan"
          onAction={() => navigation.navigate('Scan')}
        />
      ) : (
        <>
          {scans.length > 1 ? (
            <Card style={{ marginBottom: space.md, gap: space.sm }}>
              <View style={styles.trendHead}>
                <T variant="h3">Risk over time</T>
                {change !== null ? (
                  <View style={[styles.change, { backgroundColor: change > 0 ? colors.risk.HIGH.bg : colors.risk.LOW.bg }]}>
                    <Ionicons
                      name={change > 0 ? 'trending-up' : change < 0 ? 'trending-down' : 'remove'}
                      size={14}
                      color={change > 0 ? colors.risk.HIGH.fg : colors.risk.LOW.fg}
                    />
                    <Text style={[styles.changeText, { color: change > 0 ? colors.risk.HIGH.fg : colors.risk.LOW.fg }]}>
                      {change > 0 ? '+' : ''}{change} since last scan
                    </Text>
                  </View>
                ) : null}
              </View>
              <Trend scans={scans} />
            </Card>
          ) : null}

          <View style={{ gap: 10 }}>
            {scans.map((s) => (
              <Card key={s.scan_id} onPress={() => navigation.navigate('AnalysisResults', { scanId: s.scan_id })} style={styles.row}>
                <View style={[styles.score, { backgroundColor: colors.risk[s.risk_level].bg }]}>
                  <Text style={[styles.scoreText, { color: colors.risk[s.risk_level].fg }]}>{s.risk_score}</Text>
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <T variant="bodyMedium" numberOfLines={1}>{s.identifier}</T>
                  <Muted variant="caption">{formatDate(s.created_at, true)} · {s.results.length} findings</Muted>
                  <RiskBadge level={s.risk_level} />
                </View>
                <View style={{ gap: 6 }}>
                  <Pressable
                    onPress={() => navigation.navigate('ReportPreview', { scanId: s.scan_id })}
                    hitSlop={6}
                    style={[styles.action, { backgroundColor: colors.sky }]}
                    accessibilityLabel="View report"
                  >
                    <Ionicons name="document-text-outline" size={17} color={colors.skyInk} />
                  </Pressable>
                  <Pressable
                    onPress={() => setToDelete(s)}
                    hitSlop={6}
                    style={[styles.action, { backgroundColor: colors.risk.HIGH.bg }]}
                    accessibilityLabel="Delete scan"
                  >
                    <Ionicons name="trash-outline" size={17} color={colors.danger} />
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}

      <ConfirmDialog
        visible={!!toDelete}
        title="Delete this scan?"
        message={toDelete ? `The scan of ${toDelete.identifier} from ${formatDate(toDelete.created_at)} will be removed. This can’t be undone.` : ''}
        confirmLabel="Delete scan"
        destructive
        onCancel={() => setToDelete(null)}
        onConfirm={() => { deleteScan(toDelete.scan_id); setToDelete(null); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  trendHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  change: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  changeText: { fontFamily: font.semibold, fontSize: 12 },
  trend: { flexDirection: 'row', gap: 10, height: 120, alignItems: 'flex-end', marginTop: space.sm },
  barCol: { flex: 1, alignItems: 'center', gap: 6, height: '100%' },
  barTrack: { flex: 1, width: '100%', maxWidth: 28, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 8 },
  barLabel: { fontFamily: font.medium, fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  score: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scoreText: { fontFamily: font.bold, fontSize: 20 },
  action: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
