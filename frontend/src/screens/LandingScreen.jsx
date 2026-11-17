// Landing: black + neon green radar. The sweep line spins and the
// "found" dots blink, hinting at what a CyberTrace scan does.
import { useEffect, useRef } from 'react';
import {
  Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { brand, font, mono, space } from '../theme/theme';

const C = {
  bg: brand.hero,
  ring: '#1C3A2A',
  ringInner: '#2A5A40',
  neon: brand.accent,
  text: brand.heroText,
  muted: brand.heroMuted,
  red: '#FF5C7A',
  amber: '#FFC24B',
};
const useNative = Platform.OS !== 'web';

// Blips on the radar: position as a fraction of the radar size.
const BLIPS = [
  { top: 0.16, left: 0.70, size: 11, color: C.red, delay: 0 },
  { top: 0.72, left: 0.18, size: 10, color: C.amber, delay: 700 },
  { top: 0.36, left: 0.10, size: 8, color: C.amber, delay: 1300 },
  { top: 0.80, left: 0.70, size: 8, color: C.neon, delay: 1900 },
];

function Blip({ blip, radar }) {
  const pulse = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(blip.delay),
      Animated.timing(pulse, { toValue: 1, duration: 350, useNativeDriver: useNative }),
      Animated.timing(pulse, { toValue: 0.25, duration: 1400, useNativeDriver: useNative }),
      Animated.delay(Math.max(0, 1200 - blip.delay / 2)),
    ]));
    loop.start();
    return () => loop.stop();
  }, [blip.delay, pulse]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: radar * blip.top,
        left: radar * blip.left,
        width: blip.size,
        height: blip.size,
        borderRadius: blip.size / 2,
        backgroundColor: blip.color,
        opacity: pulse,
      }}
    />
  );
}

function Radar({ size }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, {
      toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: useNative,
    }));
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const ring = (d, color = C.ring) => ({
    position: 'absolute',
    width: d, height: d, borderRadius: d / 2,
    top: (size - d) / 2, left: (size - d) / 2,
    borderWidth: 1, borderColor: color,
  });

  return (
    <View style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={ring(size)} />
      <View style={ring(size * 0.68)} />
      <View style={ring(size * 0.36, C.ringInner)} />
      {/* cross hairs */}
      <View style={[styles.hair, { top: size / 2, left: 0, width: size, height: 1 }]} />
      <View style={[styles.hair, { left: size / 2, top: 0, height: size, width: 1 }]} />

      {/* sweep: a full-size square that rotates; the line sits on its right half */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
        <View style={{ position: 'absolute', top: size / 2 - 1, left: size / 2, width: size / 2, height: 2, backgroundColor: C.neon, borderRadius: 1 }} />
        <View style={{ position: 'absolute', top: size / 2 - 7, left: size / 2, width: size / 2, height: 14, backgroundColor: C.neon, opacity: 0.08 }} />
      </Animated.View>

      {BLIPS.map((b) => <Blip key={`${b.top}-${b.left}`} blip={b} radar={size} />)}

      <View style={[styles.core, {
        width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15,
        top: size * 0.35, left: size * 0.35,
      }]}
      >
        <Ionicons name="finger-print" size={size * 0.17} color={C.neon} />
      </View>
    </View>
  );
}

export default function LandingScreen({ navigation }) {
  const { width, height } = useWindowDimensions();
  const radar = Math.min(width - 72, height * 0.4, 320);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View style={styles.inner}>
          <View style={styles.brandRow}>
            <Ionicons name="shield-checkmark" size={16} color={C.neon} />
            <Text style={styles.brand}>cybertrace</Text>
          </View>

          <View style={styles.radarWrap}>
            <Radar size={radar} />
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.title}>See where you’re exposed online</Text>
            <Text style={styles.subtitle}>One scan. Every leak on the radar.</Text>
            <View style={styles.legend}>
              {[[C.red, 'breaches'], [C.amber, 'public info'], [C.neon, 'safe']].map(([c, l]) => (
                <View key={l} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: c }]} />
                  <Text style={styles.legendText}>{l}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.primaryText}>Get started</Text>
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Login')} accessibilityRole="button" style={styles.secondary}>
              <Text style={styles.secondaryText}>&gt; log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, padding: space.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: space.sm },
  brand: { fontFamily: mono, fontSize: 15, color: C.neon },
  radarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: space.lg, minHeight: 260 },
  hair: { position: 'absolute', backgroundColor: C.ring, opacity: 0.6 },
  core: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0D1F17', borderWidth: 1, borderColor: '#2A5A40',
  },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 34, color: C.text, textAlign: 'center', maxWidth: 320 },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: C.muted, marginTop: space.sm, textAlign: 'center' },
  legend: { flexDirection: 'row', gap: 14, marginTop: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: mono, fontSize: 12, color: C.muted },
  actions: { marginTop: space.xl, gap: 4 },
  primary: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.neon, borderRadius: 14, minHeight: 54,
  },
  primaryText: { fontFamily: font.bold, fontSize: 16, color: C.bg },
  secondary: { alignItems: 'center', paddingVertical: 14 },
  secondaryText: { fontFamily: mono, fontSize: 14, color: C.muted },
});
