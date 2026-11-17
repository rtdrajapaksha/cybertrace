import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { signUp, validateRegistration } from '../services/authService';

export default function RegisterScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If Supabase logs the user in straight away, App.js switches to the
  // Dashboard. If email confirmation is on, we tell them to check their inbox.
  const handleRegister = async () => {
    const form = { firstName, lastName, email, password };
    const problem = validateRegistration(form);
    if (problem) return setError(problem);

    setError('');
    setInfo('');
    setSubmitting(true);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start understanding your digital exposure</Text>

      <View style={styles.form}>
        <View style={styles.row}>
          <View style={[styles.field, styles.rowField]}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jane"
              placeholderTextColor="#64748B"
            />
          </View>
          <View style={[styles.field, styles.rowField]}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748B"
            secureTextEntry
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {info ? <Text style={styles.infoText}>{info}</Text> : null}

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.primaryButtonText}>Sign Up</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Log in</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 24,
    paddingTop: 96,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#94A3B8',
  },
  form: {
    marginTop: 32,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#CBD5E1',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: '#111827',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#F87171',
    fontSize: 14,
  },
  infoText: {
    color: '#34D399',
    fontSize: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    marginTop: 4,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#7DD3FC',
    fontWeight: '600',
  },
});
