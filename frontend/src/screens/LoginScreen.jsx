import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Field, HeroHeader, Muted, Sheet, TextLink } from '../components/ui';
import { brand, space, useTheme } from '../theme/theme';
import { sendPasswordReset, signIn, validateCredentials } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // On success the auth listener in App.js switches to the app.
  const handleLogin = async () => {
    const problem = validateCredentials({ email, password });
    if (problem) return setError(problem);
    setError(''); setInfo(''); setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    setError(''); setInfo('');
    try {
      await sendPasswordReset(email);
      setInfo('If an account exists for that email, a reset link is on its way.');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: brand.hero }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <HeroHeader
            onBack={() => navigation.goBack()}
            prompt="login"
            title="Welcome back"
            subtitle="Log in to see your privacy dashboard."
          />
          <Sheet style={{ backgroundColor: colors.card, gap: space.md }}>
            <Field
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            <Field
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secure
              autoComplete="password"
              onSubmitEditing={handleLogin}
            />
            <View style={{ alignItems: 'flex-end' }}>
              <TextLink label="Forgot password?" onPress={handleForgot} />
            </View>

            {error ? <Banner text={error} tone="danger" icon="alert-circle" /> : null}
            {info ? <Banner text={info} tone="mint" icon="checkmark-circle" /> : null}

            <Button label="Log in" onPress={handleLogin} loading={submitting} style={{ marginTop: space.sm }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.sm }}>
              <Muted>New to CyberTrace?</Muted>
              <TextLink label="Create an account" onPress={() => navigation.replace('Register')} />
            </View>
          </Sheet>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
