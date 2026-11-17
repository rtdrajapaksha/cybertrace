// Live progress while a scan runs, then jumps to the results.
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Banner, Button, Card, T, Muted } from '../components/ui';
import { brand, font, space, useTheme } from '../theme/theme';
import { runScan, SCAN_STEPS } from '../services/scanService';
import { useScans } from '../state/scanStore';

function ProgressRing({ percent, size = 168, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={brand.heroField} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r} stroke={brand.accent} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - percent / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ fontFamily: font.bold, fontSize: 40, color: brand.heroText }}>{percent}%</Text>
        <Text style={{ fontFamily: font.medium, fontSize: 13, color: brand.heroMuted }}>scanning</Text>
      </View>
    </View>
  );
}

export default function AnalysisInProgressScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { identifier, type } = route.params;
  const { addScan } = useScans();
  const [step, setStep] = useState(0);
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const signal = useRef({ cancelled: false });

  useEffect(() => {
    signal.current = { cancelled: false };
    setError(''); setStep(0); setPercent(0);
    runScan({
      identifier,
      type,
      signal: signal.current,
      onProgress: (s, p) => { setStep(s); setPercent(p); },
    })
      .then((scan) => {
        addScan(scan);
        navigation.replace('AnalysisResults', { scanId: scan.scan_id, justFinished: true });
      })
      .catch((e) => { if (e.message !== 'cancelled') setError('The scan couldn’t finish. Check your connection and try again.'); });
    return () => { signal.current.cancelled = true; };
  }, [identifier, type, attempt]);

  const cancel = () => { signal.current.cancelled = true; navigation.goBack(); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: brand.hero }}>
      <View style={styles.top}>
        <ProgressRing percent={percent} />
        <Text style={styles.title}>Scanning your footprint</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{identifier}</Text>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.bg }]}>
        <Card style={{ paddingVertical: 8 }}>
          {SCAN_STEPS.map((s, i) => {
            const done = i < step || percent === 100;
            const active = i === step && !done;
            return (
              <View key={s.key} style={[styles.step, i < SCAN_STEPS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
                <View style={[
                  styles.dot,
                  { backgroundColor: done ? colors.mint : active ? colors.lavender : colors.cardAlt },
                ]}
                >
                  <Ionicons
                    name={done ? 'checkmark' : s.icon}
                    size={16}
                    color={done ? colors.mintInk : active ? colors.lavenderInk : colors.textMuted}
                  />
                </View>
                <T variant="bodyMedium" color={done || active ? colors.text : colors.textMuted} style={{ flex: 1 }}>{s.label}</T>
                {active ? <Muted variant="caption">In progress…</Muted> : null}
              </View>
            );
          })}
        </Card>

        {error ? (
          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Banner text={error} tone="danger" icon="alert-circle" />
            <Button label="Try again" icon="refresh" onPress={() => setAttempt((a) => a + 1)} />
          </View>
        ) : null}

        <Button label="Cancel scan" variant="secondary" onPress={cancel} style={{ marginTop: space.md }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', paddingTop: space.xl, paddingBottom: space.xl + space.md, paddingHorizontal: space.lg },
  title: { fontFamily: font.bold, fontSize: 24, color: brand.heroText, marginTop: space.lg },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: brand.heroMuted, marginTop: 6 },
  sheet: { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: space.lg, marginTop: -space.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  dot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
