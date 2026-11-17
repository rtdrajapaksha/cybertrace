import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { signIn, validateCredentials } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // On success the auth listener in App.js switches to the Dashboard.
  const handleLogin = async () => {
    const problem = validateCredentials({ email, password });
    if (problem) return setError(problem);

    setError('');
    setSubmitting(true);
    try {
      await signIn({ email, password });
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to view your privacy dashboard</Text>

      <View style={styles.form}>
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

        <Pressable
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.primaryButtonText}>Log In</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>
            Don&apos;t have an account? <Text style={styles.linkTextBold}>Sign up</Text>
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
