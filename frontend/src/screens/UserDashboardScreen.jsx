import { StyleSheet, Text, View, Pressable } from 'react-native';

// Placeholder dashboard: confirms the auth navigation flow lands somewhere.
// Real dashboard content (risk score, scan history, etc.) comes in a later phase.
export default function UserDashboardScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>You're logged in. Dashboard content coming soon.</Text>

      <Pressable
        style={styles.logoutButton}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Landing' }] })}
      >
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
    fontSize: 14,
    color: '#94A3B8',
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
