// Settings: appearance, notifications, data, about.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import {
  Banner, Card, ConfirmDialog, IconButton, ListRow, Muted, Screen, T, Toggle,
} from '../components/ui';
import { space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import { useScans } from '../state/scanStore';
import { updateProfile } from '../services/authService';

export default function SettingsScreen({ navigation }) {
  const { mode, setMode } = useTheme();
  const { user, profile, setProfile } = useAuth();
  const { scans, clearScans } = useScans();
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState(null);

  const prefs = profile?.preferences || {};
  const setPref = async (key, value) => {
    setMessage(null);
    const next = { ...prefs, [key]: value };
    setProfile((p) => (p ? { ...p, preferences: next } : p)); // instant UI
    try {
      setProfile(await updateProfile(user.id, { preferences: next }));
    } catch (e) {
      setProfile((p) => (p ? { ...p, preferences: prefs } : p));
      setMessage({ tone: 'danger', text: e.message });
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} label="Go back" />
        <T variant="h3">Settings</T>
        <View style={{ width: 40 }} />
      </View>

      {message ? <Banner tone={message.tone} icon="information-circle" text={message.text} /> : null}

      <Muted variant="label" style={styles.group}>APPEARANCE</Muted>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow
          icon="moon-outline"
          tone="lavender"
          title="Dark mode"
          subtitle="Easier on the eyes at night"
          right={<Toggle value={mode === 'dark'} onValueChange={(v) => setMode(v ? 'dark' : 'light')} />}
          last
        />
      </Card>

      <Muted variant="label" style={styles.group}>NOTIFICATIONS</Muted>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow
          icon="notifications-outline"
          tone="peach"
          title="Scan complete alerts"
          subtitle="Tell me when a scan finishes"
          right={<Toggle value={prefs.scanAlerts !== false} onValueChange={(v) => setPref('scanAlerts', v)} />}
        />
        <ListRow
          icon="mail-outline"
          tone="sky"
          title="Monthly privacy reminder"
          subtitle="Email me to re-scan once a month"
          right={<Toggle value={!!prefs.monthlyReminder} onValueChange={(v) => setPref('monthlyReminder', v)} />}
          last
        />
      </Card>

      <Muted variant="label" style={styles.group}>YOUR DATA</Muted>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow
          icon="trash-outline"
          title="Clear scan history"
          subtitle={`${scans.length} ${scans.length === 1 ? 'scan' : 'scans'} saved`}
          danger
          onPress={scans.length ? () => setConfirmClear(true) : undefined}
          last
        />
      </Card>

      <Muted variant="label" style={styles.group}>ABOUT</Muted>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="shield-checkmark-outline" tone="mint" title="CyberTrace" subtitle={`Version ${Constants.expoConfig?.version ?? '1.0.0'} · NIT3003 Capstone, Group 9`} />
        <ListRow icon="lock-closed-outline" tone="sky" title="How we handle your data" subtitle="We only check public sources. Passwords are never stored by CyberTrace." last />
      </Card>

      <ConfirmDialog
        visible={confirmClear}
        title="Clear all scans?"
        message="Every saved scan, finding and tip will be removed. This can’t be undone."
        confirmLabel="Clear history"
        destructive
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => { clearScans(); setConfirmClear(false); setMessage({ tone: 'mint', text: 'Scan history cleared.' }); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  group: { marginTop: space.lg, marginBottom: space.sm, letterSpacing: 0.6 },
});
