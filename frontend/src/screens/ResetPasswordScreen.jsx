// Shown after the user opens a "reset your password" email link.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Banner, Button, Field, HeroHeader, PasswordStrength, Sheet, TextLink,
} from '../components/ui';
import { brand, space, useTheme } from '../theme/theme';
import { useAuth } from '../state/authStore';
import {
  PASSWORD_RULES, changePassword, passwordStrength, signOut,
} from '../services/authService';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { user, finishRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (password !== confirm) return setError('The two passwords don’t match.');
    setError(''); setSaving(true);
    try {
      await changePassword(password);
      finishRecovery(); // App.js now shows the normal app
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: brand.hero }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <HeroHeader
            prompt="reset-password"
            title="Set a new password"
            subtitle={user?.email ? `For ${user.email}` : 'Choose a password you don’t use anywhere else.'}
          />
          <Sheet style={{ backgroundColor: colors.card, gap: space.md }}>
            <Field
              label="New password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secure
              autoComplete="new-password"
            />
            <PasswordStrength password={password} strength={passwordStrength(password)} rules={PASSWORD_RULES} />
            <Field
              label="Confirm new password"
              icon="lock-closed-outline"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Type it again"
              secure
              autoComplete="new-password"
              onSubmitEditing={save}
            />
            {error ? <Banner text={error} tone="danger" icon="alert-circle" /> : null}
            <Button label="Save new password" onPress={save} loading={saving} style={{ marginTop: space.sm }} />
            <TextLink
              label="Cancel and log out"
              color={colors.textMuted}
              onPress={() => { finishRecovery(); signOut().catch(() => {}); }}
              style={{ textAlign: 'center' }}
            />
          </Sheet>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
