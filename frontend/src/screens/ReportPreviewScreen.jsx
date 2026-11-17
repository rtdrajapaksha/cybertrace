// Printable-style report for one scan. PDF export arrives with the backend (PDFKit).
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Banner, Button, Card, DemoBadge, EmptyState, IconButton, Muted, RiskBadge, Screen, T, formatDate,
} from '../components/ui';
import { ScoreGauge } from '../components/RiskScoreCard';
import { font, space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import { useScans } from '../state/scanStore';
import { CATEGORY_COPY, RISK_COPY, SEVERITY_POINTS } from '../utils/riskScoring';

function Row({ label, value }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.kv, { borderBottomColor: colors.border }]}>
      <Muted variant="small">{label}</Muted>
      <T variant="small" style={{ fontFamily: font.semibold, flexShrink: 1, textAlign: 'right' }}>{value}</T>
    </View>
  );
}

export default function ReportPreviewScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { profile, user } = useAuth();
  const { getScan } = useScans();
  const scan = getScan(route.params.scanId);
  if (!scan) {
    return (
      <Screen>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} label="Go back" />
        <EmptyState icon="document-text" title="Report not found" text="This scan may have been deleted." />
      </Screen>
    );
  }

  const owner = profile ? `${profile.first_name} ${profile.last_name}`.trim() : user?.email;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} label="Go back" />
        <T variant="h3">Privacy report</T>
        <View style={{ width: 40 }} />
      </View>

      <Card style={{ gap: space.md }}>
        <View style={styles.brandRow}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={18} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <T variant="h3">CyberTrace Privacy Report</T>
            <Muted variant="caption">Generated {formatDate(scan.completed_at, true)}</Muted>
          </View>
          {scan.demo ? <DemoBadge /> : null}
        </View>

        <View style={styles.scoreRow}>
          <ScoreGauge score={scan.risk_score} level={scan.risk_level} size={110} stroke={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <RiskBadge level={scan.risk_level} label={RISK_COPY[scan.risk_level].label} />
            <T variant="small">{RISK_COPY[scan.risk_level].summary}</T>
          </View>
        </View>

        <View>
          <Row label="Prepared for" value={owner || '—'} />
          <Row label="Scanned" value={`${scan.identifier} (${scan.identifier_type.toLowerCase()})`} />
          <Row label="Findings" value={String(scan.results.length)} />
          <Row label="Tips" value={`${scan.completedTips.length} of ${scan.recommendations.length} done`} />
        </View>
      </Card>

      <T variant="h3" style={{ marginTop: space.lg, marginBottom: space.sm }}>Findings</T>
      <Card style={{ paddingVertical: 6 }}>
        {scan.results.map((r, i) => (
          <View key={r.result_id} style={[styles.finding, i < scan.results.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <T variant="small" style={{ fontFamily: font.semibold }}>{r.title}</T>
              <Muted variant="caption">{CATEGORY_COPY[r.category].label} · {r.source}</Muted>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <RiskBadge level={r.severity} />
              <Text style={[styles.points, { color: colors.textMuted }]}>+{SEVERITY_POINTS[r.severity]} pts</Text>
            </View>
          </View>
        ))}
      </Card>

      <T variant="h3" style={{ marginTop: space.lg, marginBottom: space.sm }}>Recommended actions</T>
      <Card style={{ gap: 10 }}>
        {scan.recommendations.map((t, i) => (
          <View key={t.key} style={styles.tipRow}>
            <Text style={[styles.tipNum, { color: colors.textMuted }]}>{i + 1}.</Text>
            <T variant="small" style={{ flex: 1 }}>{t.title}</T>
            {scan.completedTips.includes(t.key) ? <Ionicons name="checkmark-circle" size={18} color={colors.risk.LOW.fg} /> : null}
          </View>
        ))}
      </Card>

      <Muted variant="caption" style={{ marginTop: space.md }}>
        Score method: High finding +25, Medium +10, Low +5, capped at 100. 75+ Critical, 50+ High, 25+ Medium, otherwise Low.
      </Muted>

      <View style={{ gap: 10, marginTop: space.lg }}>
        <Button label="Download PDF" icon="download-outline" disabled />
        <Banner tone="sky" text="PDF download will work once the CyberTrace backend is connected." />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  finding: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  points: { fontFamily: font.medium, fontSize: 11 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tipNum: { fontFamily: font.semibold, fontSize: 14, width: 20 },
});
