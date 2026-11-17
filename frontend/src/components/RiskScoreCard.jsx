// Circular risk gauge: number + level label + icon (report 3.4.2).
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Card, Muted, RiskBadge, T } from './ui';
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

export default function RiskScoreCard({ scan, title = 'Privacy risk score', footer, onPress }) {
  const copy = RISK_COPY[scan.risk_level];
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={{ flex: 1, gap: space.sm }}>
          <Muted variant="label">{title.toUpperCase()}</Muted>
          <RiskBadge level={scan.risk_level} label={copy.label} />
          <T variant="small" style={{ marginTop: 2 }}>{copy.summary}</T>
        </View>
        <ScoreGauge score={scan.risk_score} level={scan.risk_level} />
      </View>
      {footer}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  center: { alignItems: 'center', justifyContent: 'center' },
});
