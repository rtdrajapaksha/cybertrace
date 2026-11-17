// Profile: who you are, your activity, edit name, change password, log out.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Banner, Card, ConfirmDialog, Field, IconButton, ListRow, Muted, Pill, Screen, T, formatDate,
} from '../components/ui';
import { font, space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import { useScans } from '../state/scanStore';
import { changePassword, signOut, updateProfile } from '../services/authService';

export default function UserProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const { user, profile, setProfile } = useAuth();
  const { scans } = useScans();
  const [dialog, setDialog] = useState(null); // 'name' | 'password' | 'logout'
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fullName = profile ? `${profile.first_name} ${profile.last_name}`.trim() : '';
  const name = fullName || user?.email?.split('@')[0] || 'You';
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const findings = scans.reduce((n, s) => n + s.results.length, 0);
  const tipsDone = scans.reduce((n, s) => n + s.completedTips.length, 0);

  const open = (which) => {
    setError(''); setToast('');
    if (which === 'name') { setFirst(profile?.first_name || ''); setLast(profile?.last_name || ''); }
    if (which === 'password') setPassword('');
    setDialog(which);
  };

  const saveName = async () => {
    if (!first.trim() || !last.trim()) return setError('Please enter your first and last name.');
    try {
      const updated = await updateProfile(user.id, { first_name: first.trim(), last_name: last.trim() });
      setProfile(updated); setDialog(null); setToast('Your name was updated.');
    } catch (e) { setError(e.message); }
  };

  const savePassword = async () => {
    try {
      await changePassword(password);
      setDialog(null); setToast('Your password was changed.');
    } catch (e) { setError(e.message); }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <T variant="h1">Profile</T>
        <IconButton icon="settings-outline" onPress={() => navigation.navigate('Settings')} label="Open settings" />
      </View>

      <Card style={styles.idCard}>
        <View style={[styles.avatar, { backgroundColor: colors.lavender, borderColor: colors.card }]}>
          <Text style={[styles.initials, { color: colors.lavenderInk }]}>{initials}</Text>
        </View>
        <T variant="h2" style={{ marginTop: space.sm }}>{name}</T>
        <Muted>{user?.email}</Muted>
        <View style={styles.pills}>
          <Pill label="Verified email" icon="checkmark-circle" fg={colors.mintInk} bg={colors.mint} />
          {profile?.created_at ? (
            <Pill label={`Member since ${formatDate(profile.created_at)}`} fg={colors.textMuted} bg={colors.cardAlt} />
          ) : null}
        </View>
      </Card>

      {toast ? <View style={{ marginTop: space.md }}><Banner tone="mint" icon="checkmark-circle" text={toast} /></View> : null}

      <Card tone="primary" style={styles.stats}>
        {[
          { label: 'Scans', value: scans.length },
          { label: 'Findings', value: findings },
          { label: 'Tips done', value: tipsDone },
        ].map((s, i) => (
          <View key={s.label} style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={[styles.statValue, { color: colors.onPrimary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.onPrimaryMuted }]}>{s.label}</Text>
          </View>
        ))}
      </Card>

      <T variant="h3" style={styles.groupTitle}>Account</T>
      <Card style={{ paddingVertical: 4 }}>
        <ListRow icon="person-outline" tone="lavender" title="Edit name" subtitle="Update how your name appears" onPress={() => open('name')} />
        <ListRow icon="key-outline" tone="peach" title="Change password" subtitle="Set a new password for your account" onPress={() => open('password')} />
        <ListRow icon="settings-outline" tone="sky" title="Settings" subtitle="Appearance, notifications and data" onPress={() => navigation.navigate('Settings')} last />
      </Card>

      <Card style={{ paddingVertical: 4, marginTop: space.md }}>
        <ListRow icon="log-out-outline" title="Log out" subtitle="End your session on this device" danger onPress={() => open('logout')} last />
      </Card>

      <ConfirmDialog
        visible={dialog === 'name'}
        title="Edit name"
        confirmLabel="Save"
        onCancel={() => setDialog(null)}
        onConfirm={saveName}
      >
        <View style={{ gap: space.md, marginTop: space.md }}>
          <Field label="First name" value={first} onChangeText={setFirst} />
          <Field label="Last name" value={last} onChangeText={setLast} />
          {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
        </View>
      </ConfirmDialog>

      <ConfirmDialog
        visible={dialog === 'password'}
        title="Change password"
        message="Use at least 8 characters. A password you don’t use anywhere else is best."
        confirmLabel="Change password"
        onCancel={() => setDialog(null)}
        onConfirm={savePassword}
      >
        <View style={{ gap: space.md, marginTop: space.md }}>
          <Field label="New password" icon="lock-closed-outline" value={password} onChangeText={setPassword} secure autoComplete="new-password" />
          {error ? <Banner tone="danger" icon="alert-circle" text={error} /> : null}
        </View>
      </ConfirmDialog>

      <ConfirmDialog
        visible={dialog === 'logout'}
        title="Log out?"
        message="You’ll need your email and password to log back in."
        confirmLabel="Log out"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => { setDialog(null); signOut().catch(() => {}); }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: space.md },
  idCard: { alignItems: 'center', paddingVertical: space.lg },
  avatar: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  initials: { fontFamily: font.bold, fontSize: 32 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: space.md },
  stats: { flexDirection: 'row', marginTop: space.md, paddingVertical: space.md },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: font.bold, fontSize: 26 },
  statLabel: { fontFamily: font.medium, fontSize: 12, marginTop: 2 },
  groupTitle: { marginTop: space.lg, marginBottom: space.sm },
});
