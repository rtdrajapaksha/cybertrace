// Risk score: big number + level (colour, icon and words) + block bar.
// ScoreGauge (the ring) is still used on the report screen.
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BlockBar, Card, Mono, T } from './ui';
import { font, space, useTheme } from '../theme/theme';
import { RISK_COPY } from '../utils/riskScoring';

export function ScoreGauge({ score, level, size = 132, stroke = 12 }) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fg = colors.risk[level].fg;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.cardAlt} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fg}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - Math.max(score, 2) / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={{ fontFamily: font.bold, fontSize: size * 0.27, color: colors.text }}>{score}</Text>
        <Text style={{ fontFamily: font.medium, fontSize: 12, color: colors.textMuted }}>out of 100</Text>
      </View>
    </View>
  );
}

export default function RiskScoreCard({ scan, title = 'risk_score', footer, onPress }) {
  const { colors } = useTheme();
  const risk = colors.risk[scan.risk_level];
  const copy = RISK_COPY[scan.risk_level];
  return (
    <Card onPress={onPress} style={{ gap: space.sm + 2 }}>
      <View style={styles.top}>
        <Mono size={12} color={colors.textMuted}>{title}</Mono>
        <Mono size={12} color={colors.textMuted} numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>{scan.identifier}</Mono>
      </View>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: risk.fg }]}>{scan.risk_score}</Text>
        <Mono size={14} color={colors.textMuted}>/100</Mono>
        <View style={styles.level}>
          <Ionicons name={risk.icon} size={14} color={risk.fg} />
          <Mono size={13} color={risk.fg}>{scan.risk_level}</Mono>
        </View>
      </View>
      <BlockBar value={scan.risk_score} color={risk.fg} />
      <T variant="small" color={colors.textMuted}>{copy.summary}</T>
      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  score: { fontFamily: font.bold, fontSize: 52, lineHeight: 58 },
  level: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto' },
});
