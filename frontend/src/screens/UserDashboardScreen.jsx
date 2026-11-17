import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useAuth } from '../state/authStore';
import { getProfile, signOut } from '../services/authService';

// Placeholder dashboard: proves the user is really logged in by loading
// their row from public.users. Real content (risk score, scan history)
// comes in a later phase.
export default function UserDashboardScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getProfile(user.id)
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, [user]);

  // After sign out, App.js switches back to the Landing screen.
  const handleLogout = () => signOut().catch((e) => setError(e.message));

  const name = profile?.first_name || user?.email;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        {name ? `Welcome, ${name}!` : 'Loading your profile…'}
      </Text>
      {profile ? <Text style={styles.meta}>{profile.email} · {profile.plan} plan</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 24,
    paddingTop: 96,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#E2E8F0',
    textAlign: 'center',
  },
  meta: {
    marginTop: 6,
    fontSize: 13,
    color: '#94A3B8',
  },
  errorText: {
    marginTop: 12,
    color: '#F87171',
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  logoutButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '500',
  },
});
