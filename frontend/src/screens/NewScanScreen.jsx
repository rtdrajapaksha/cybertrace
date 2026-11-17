// Start a scan: pick Email or Username, enter it, go.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  Banner, Button, Field, HeroHeader, IconBubble, Muted, Segmented, Sheet, T,
} from '../components/ui';
import { brand, font, radius, space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import { DEMO_MODE, SCAN_STEPS, validateIdentifier } from '../services/scanService';

export default function NewScanScreen({ navigation }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [type, setType] = useState('EMAIL');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const start = () => {
    const problem = validateIdentifier(value, type);
    if (problem) return setError(problem);
    setError('');
    navigation.navigate('AnalysisInProgress', { identifier: value.trim(), type });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: brand.hero }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <HeroHeader
            prompt="new-scan"
            title="New scan"
            subtitle="See where your email or username shows up across the public web."
          >
            <View style={styles.heroChips}>
              {SCAN_STEPS.slice(0, 3).map((s) => (
                <View key={s.key} style={styles.heroChip}>
                  <Ionicons name={s.icon} size={14} color={brand.accent} />
                  <Text style={styles.heroChipText}>{s.label.replace(/^(Checking|Searching|Looking up) /, '')}</Text>
                </View>
              ))}
            </View>
          </HeroHeader>

          <Sheet style={{ gap: space.md, paddingBottom: 120 }}>
            <Segmented
              value={type}
              onChange={(t) => { setType(t); setError(''); }}
              options={[
                { value: 'EMAIL', label: 'Email', icon: 'mail-outline' },
                { value: 'USERNAME', label: 'Username', icon: 'at' },
              ]}
            />

            <Field
              label={type === 'EMAIL' ? 'Email address' : 'Username'}
              icon={type === 'EMAIL' ? 'mail-outline' : 'at'}
              value={value}
              onChangeText={(t) => { setValue(t); if (error) setError(''); }}
              placeholder={type === 'EMAIL' ? 'you@example.com' : 'your_handle'}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={type === 'EMAIL' ? 'email-address' : 'default'}
              error={error}
              onSubmitEditing={start}
            />

            {type === 'EMAIL' && user?.email && value.trim().toLowerCase() !== user.email ? (
              <Button
                label="Use my account email"
                variant="secondary"
                icon="person-circle-outline"
                onPress={() => { setValue(user.email); setError(''); }}
              />
            ) : null}

            <Button label="Start scan" icon="scan" onPress={start} />

            <Banner
              icon="shield-checkmark"
              tone="mint"
              text="We only look at publicly available information. Nothing is posted or changed on your accounts."
            />
            {DEMO_MODE ? (
              <Banner
                icon="flask"
                tone="sky"
                text="Demo mode: results are sample data until the CyberTrace scanner backend is connected."
              />
            ) : null}

            <View style={styles.infoRow}>
              {[
                { icon: 'timer-outline', tone: 'peach', label: 'Takes', value: '~5 seconds' },
                { icon: 'layers-outline', tone: 'lavender', label: 'Checks', value: '3 sources' },
              ].map((i) => (
                <View key={i.label} style={[styles.info, { backgroundColor: colors.card }]}>
                  <IconBubble icon={i.icon} tone={i.tone} size={36} />
                  <View>
                    <Muted variant="caption">{i.label}</Muted>
                    <T variant="label">{i.value}</T>
                  </View>
                </View>
              ))}
            </View>
          </Sheet>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
  heroChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: brand.heroField,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill,
  },
  heroChipText: { fontFamily: font.medium, fontSize: 13, color: brand.heroText, textTransform: 'capitalize' },
  infoRow: { flexDirection: 'row', gap: 10 },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radius.tile },
});
