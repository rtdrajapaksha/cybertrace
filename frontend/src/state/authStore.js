// Global auth state: who is logged in, plus their public.users profile.
// Wrap the app in <AuthProvider> and read it anywhere with useAuth().
import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/authService';

const AuthContext = createContext({ session: null, user: null, profile: null, loading: true });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // True after the user opens a password-reset link, until they set a new one.
  const [recovering, setRecovering] = useState(false);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    // Restore a saved login from the previous app launch.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Fires on sign in, sign out and token refresh.
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_OUT') setRecovering(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!userId) { setProfile(null); return; }
    try {
      setProfile(await getProfile(userId));
    } catch {
      // Keep the app usable even if the profile can't load; screens fall back to the email.
    }
  }, [userId]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    setProfile,
    refreshProfile,
    loading,
    recovering,
    finishRecovery: () => setRecovering(false),
  };
  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
