// One exposure finding, shown as a card (report: findings as cards grouped by severity).
import { StyleSheet, View } from 'react-native';
import { Card, IconBubble, Muted, Pill, RiskBadge, T } from './ui';
import { space, useTheme } from '../theme/theme';
import { CATEGORY_COPY } from '../utils/riskScoring';

export default function ExposureListItem({ finding }) {
  const { colors } = useTheme();
  const cat = CATEGORY_COPY[finding.category];
  return (
    <Card style={{ gap: space.sm + 4 }}>
      <View style={styles.top}>
        <IconBubble icon={cat.icon} tone={cat.tone} size={40} />
        <View style={{ flex: 1 }}>
          <T variant="bodyMedium">{finding.title}</T>
          <Muted variant="caption">{finding.source}</Muted>
        </View>
        <RiskBadge level={finding.severity} />
      </View>
      <View style={styles.tags}>
        {finding.exposed.map((e) => (
          <Pill key={e} label={e} fg={colors.textMuted} bg={colors.cardAlt} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
