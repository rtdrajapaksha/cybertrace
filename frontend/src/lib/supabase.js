// One shared Supabase client for the whole app.
// URL + publishable key come from frontend/.env (EXPO_PUBLIC_* vars).
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase config. Copy frontend/.env.example to frontend/.env and fill it in.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Keep the user logged in between app launches.
    // On web, supabase-js uses localStorage by itself.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
