// Privacy tips for a scan (latest scan by default), ordered by priority.
// Tips are rule-based (see utils/recommendations.js), no external AI.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BlockBar, Card, EmptyState, IconBubble, IconButton, PageTitle, RiskBadge, Screen, T,
} from '../components/ui';
import { font, radius, space, useTheme } from '../theme/theme';
import { useScans } from '../state/scanStore';

const TONE_BY_PRIORITY = { HIGH: 'peach', MEDIUM: 'lavender', LOW: 'mint' };

export function TipCard({ tip, done, onToggle }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Card style={[{ gap: space.sm + 4 }, done && { opacity: 0.6 }]}>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.tipTop} accessibilityRole="button">
        <IconBubble icon={tip.icon} tone={TONE_BY_PRIORITY[tip.priority]} size={42} />
        <View style={{ flex: 1, gap: 4 }}>
          <T variant="bodyMedium" style={done && { textDecorationLine: 'line-through' }}>{tip.title}</T>
          <RiskBadge level={tip.priority} label={`${tip.priority.charAt(0)}${tip.priority.slice(1).toLowerCase()} priority`} />
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>

      {open ? (
        <View style={{ gap: space.sm }}>
          <View style={[styles.why, { backgroundColor: colors.cardAlt }]}>
            <Text style={[styles.whyLabel, { color: colors.textMuted }]}>WHY IT MATTERS</Text>
            <T variant="small">{tip.rationale}</T>
          </View>
          {tip.steps.map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.lime }]}>
                <Text style={[styles.stepNumText, { color: colors.onLime }]}>{i + 1}</Text>
              </View>
              <T variant="small" style={{ flex: 1 }}>{s}</T>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={onToggle}
        style={[styles.doneBtn, { borderColor: done ? colors.mint : colors.border, backgroundColor: done ? colors.mint : 'transparent' }]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
      >
        <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={done ? colors.mintInk : colors.textMuted} />
        <Text style={[styles.doneText, { color: done ? colors.mintInk : colors.textMuted }]}>
          {done ? 'Done' : 'Mark as done'}
        </Text>
      </Pressable>
    </Card>
  );
}

export default function AIRecommendationsScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { latest, getScan, toggleTip } = useScans();
  const scanId = route.params?.scanId;
  const scan = scanId ? getScan(scanId) : latest;
  const fromStack = !!scanId;

  if (!scan) {
    return (
      <Screen>
        <PageTitle prompt="tips" title="Privacy tips" />
        <EmptyState
          icon="bulb"
          title="No tips yet"
          text="Run a scan and we’ll give you simple steps to reduce your exposure."
          actionLabel="Start a scan"
          onAction={() => navigation.navigate('Tabs', { screen: 'Scan' })}
        />
      </Screen>
    );
  }

  const total = scan.recommendations.length;
  const done = scan.completedTips.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <Screen>
      {fromStack ? <IconButton icon="arrow-back" onPress={() => navigation.goBack()} label="Go back" /> : null}
      <PageTitle prompt="tips" title="Privacy tips" subtitle={`For ${scan.identifier}`} />

      <Card highlight style={{ gap: space.sm + 4 }}>
        <View style={styles.progressTop}>
          <Text style={[styles.progressTitle, { color: colors.text }]}>{done} of {total} done</Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>{pct}%</Text>
        </View>
        <BlockBar value={done} max={Math.max(total, 1)} segments={Math.max(total, 1) * 4} />
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Highest priority first. Tap a tip to see why it matters and how to fix it.
        </Text>
      </Card>

      <View style={{ gap: 10, marginTop: space.md }}>
        {scan.recommendations.map((tip) => (
          <TipCard
            key={tip.key}
            tip={tip}
            done={scan.completedTips.includes(tip.key)}
            onToggle={() => toggleTip(scan.scan_id, tip.key)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: space.md },
  tipTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  why: { borderRadius: radius.input, padding: 12, gap: 4 },
  whyLabel: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.6 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumText: { fontFamily: font.bold, fontSize: 12 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: radius.button, paddingVertical: 10,
  },
  doneText: { fontFamily: font.semibold, fontSize: 14 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressTitle: { fontFamily: font.semibold, fontSize: 18 },
  progressPct: { fontFamily: font.bold, fontSize: 22 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  progressText: { fontFamily: font.regular, fontSize: 13 },
});
