import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Banner, Button, Field, HeroHeader, Muted, Sheet, TextLink } from '../components/ui';
import { brand, space, useTheme } from '../theme/theme';
import { signUp, validateRegistration } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If Supabase logs the user straight in, App.js switches to the app.
  // If email confirmation is on, we ask them to check their inbox.
  const handleRegister = async () => {
    const form = { firstName, lastName, email, password };
    const problem = validateRegistration(form);
    if (problem) return setError(problem);
    setError(''); setInfo(''); setSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(form);
      if (needsEmailConfirmation) {
        setInfo('Account created! Check your email to confirm it, then log in.');
        setPassword('');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: brand.hero }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <HeroHeader
            onBack={() => navigation.goBack()}
            prompt="create-account"
            title="Create your account"
            subtitle="Check your digital footprint in under two minutes."
          />
          <Sheet style={{ backgroundColor: colors.card, gap: space.md }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Field label="First name" value={firstName} onChangeText={setFirstName} placeholder="Jane" style={{ flex: 1 }} autoComplete="given-name" />
              <Field label="Last name" value={lastName} onChangeText={setLastName} placeholder="Doe" style={{ flex: 1 }} autoComplete="family-name" />
            </View>
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
              placeholder="At least 8 characters"
              secure
              autoComplete="new-password"
              onSubmitEditing={handleRegister}
            />

            {error ? <Banner text={error} tone="danger" icon="alert-circle" /> : null}
            {info ? <Banner text={info} tone="mint" icon="checkmark-circle" /> : null}

            <Button label="Create account" onPress={handleRegister} loading={submitting} style={{ marginTop: space.sm }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: space.sm }}>
              <Muted>Already have an account?</Muted>
              <TextLink label="Log in" onPress={() => navigation.replace('Login')} />
            </View>
          </Sheet>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
