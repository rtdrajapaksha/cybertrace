import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import {
  useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { AuthProvider, useAuth } from './src/state/authStore';
import { ScanProvider } from './src/state/scanStore';
import { ThemeProvider, useTheme, brand } from './src/theme/theme';
import NavigationBar from './src/components/NavigationBar';

import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';
import NewScanScreen from './src/screens/NewScanScreen';
import AnalysisInProgressScreen from './src/screens/AnalysisInProgressScreen';
import AnalysisResultsScreen from './src/screens/AnalysisResultsScreen';
import AIRecommendationsScreen from './src/screens/AIRecommendationsScreen';
import PreviousReportsScreen from './src/screens/PreviousReportsScreen';
import ReportPreviewScreen from './src/screens/ReportPreviewScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom tabs shown after login (report 3.4: persistent navigation bar).
function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <NavigationBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={UserDashboardScreen} />
      <Tab.Screen name="Scan" component={NewScanScreen} />
      <Tab.Screen name="History" component={PreviousReportsScreen} />
      <Tab.Screen name="Tips" component={AIRecommendationsScreen} />
      <Tab.Screen name="Profile" component={UserProfileScreen} />
    </Tab.Navigator>
  );
}

// Logged out -> Landing / Login / Register.
// Opened a password-reset link -> Set a new password, nothing else.
// Logged in  -> tabs + detail screens (+ Admin for admins).
// Switching happens automatically when the Supabase session changes.
function RootNavigator() {
  const { session, loading, recovering, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: brand.hero, justifyContent: 'center' }}>
        <ActivityIndicator color={brand.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      {session && recovering ? (
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      ) : session ? (
        <>
          <Stack.Screen name="Tabs" component={MainTabs} />
          <Stack.Screen name="AnalysisInProgress" component={AnalysisInProgressScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="AnalysisResults" component={AnalysisResultsScreen} />
          <Stack.Screen name="Recommendations" component={AIRecommendationsScreen} />
          <Stack.Screen name="ReportPreview" component={ReportPreviewScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          {isAdmin ? <Stack.Screen name="Admin" component={AdminDashboardScreen} /> : null}
        </>
      ) : (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function ThemedApp() {
  const { colors, mode } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: colors.bg, card: colors.card, text: colors.text, primary: colors.primary, border: colors.border },
  };
  return (
    <NavigationContainer theme={navTheme} documentTitle={{ formatter: () => 'CyberTrace' }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <ScanProvider>
        <RootNavigator />
      </ScanProvider>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: brand.hero }} />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
