// Scan results: score, category totals, findings grouped by severity, top tips.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import RiskScoreCard from '../components/RiskScoreCard';
import ExposureListItem from '../components/ExposureListItem';
import { TipCard } from './AIRecommendationsScreen';
import {
  Banner, Button, Card, ConfirmDialog, DemoBadge, EmptyState, IconBubble, IconButton, Muted,
  RiskBadge, Screen, SectionHeader, T, formatDate,
} from '../components/ui';
import { space } from '../theme/theme';
import { useScans } from '../state/scanStore';
import { CATEGORY_COPY, SEVERITY_ORDER } from '../utils/riskScoring';

export default function AnalysisResultsScreen({ route, navigation }) {
  const { scanId, justFinished } = route.params;
  const { getScan, deleteScan, toggleTip } = useScans();
  const scan = getScan(scanId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const header = (
    <View style={styles.header}>
      <IconButton icon="arrow-back" onPress={() => navigation.goBack()} label="Go back" />
      <T variant="h3">Scan results</T>
      <IconButton icon="trash-outline" onPress={() => setConfirmDelete(true)} label="Delete scan" />
    </View>
  );

  if (!scan) {
    return (
      <Screen>
        {header}
        <EmptyState icon="search" title="Scan not found" text="It may have been deleted." actionLabel="New scan" onAction={() => navigation.navigate('Tabs', { screen: 'Scan' })} />
      </Screen>
    );
  }

  const groups = SEVERITY_ORDER
    .map((sev) => ({ sev, items: scan.results.filter((r) => r.severity === sev) }))
    .filter((g) => g.items.length);

  return (
    <Screen>
      {header}

      {justFinished ? (
        <View style={{ marginBottom: space.md }}>
          <Banner tone="mint" icon="checkmark-circle" text="Scan complete. Here’s what we found." />
        </View>
      ) : null}

      <RiskScoreCard
        scan={scan}
        footer={(
          <View style={styles.meta}>
            <Muted variant="caption" style={{ flex: 1 }} numberOfLines={1}>
              {scan.identifier} · {formatDate(scan.created_at, true)}
            </Muted>
            {scan.demo ? <DemoBadge /> : null}
          </View>
        )}
      />

      <View style={styles.cats}>
        {Object.entries(CATEGORY_COPY).map(([key, c]) => (
          <Card key={key} style={styles.cat}>
            <IconBubble icon={c.icon} tone={c.tone} size={32} />
            <T variant="h2" style={{ marginTop: 6 }}>{scan.results.filter((r) => r.category === key).length}</T>
            <Muted variant="caption">{c.label}</Muted>
          </Card>
        ))}
      </View>

      {groups.map((g) => (
        <View key={g.sev}>
          <View style={styles.groupHead}>
            <T variant="h3">{g.items.length} {g.sev.toLowerCase()} risk {g.items.length === 1 ? 'finding' : 'findings'}</T>
            <RiskBadge level={g.sev} />
          </View>
          <View style={{ gap: 10 }}>
            {g.items.map((f) => <ExposureListItem key={f.result_id} finding={f} />)}
          </View>
        </View>
      ))}

      <SectionHeader
        title="Top tips for you"
        actionLabel={`All ${scan.recommendations.length}`}
        onAction={() => navigation.navigate('Recommendations', { scanId: scan.scan_id })}
      />
      <View style={{ gap: 10 }}>
        {scan.recommendations.slice(0, 2).map((tip) => (
          <TipCard
            key={tip.key}
            tip={tip}
            done={scan.completedTips.includes(tip.key)}
            onToggle={() => toggleTip(scan.scan_id, tip.key)}
          />
        ))}
      </View>

      <View style={{ gap: 10, marginTop: space.lg }}>
        <Button label="View full report" icon="document-text-outline" onPress={() => navigation.navigate('ReportPreview', { scanId: scan.scan_id })} />
        <Button label="Back to home" variant="secondary" onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} />
      </View>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this scan?"
        message="Its results and tips will be removed from your history. This can’t be undone."
        confirmLabel="Delete scan"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => { setConfirmDelete(false); deleteScan(scan.scan_id); navigation.goBack(); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.md },
  cats: { flexDirection: 'row', gap: 10, marginTop: space.md },
  cat: { flex: 1, padding: 14 },
  groupHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: space.lg, marginBottom: space.sm + 4,
  },
});
