// Authentication calls to Supabase Auth.
// Each function throws an Error with a user-friendly message on failure.
import { supabase } from '../lib/supabase';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function friendlyMessage(error) {
  const msg = error?.message || 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first (check your inbox).';
  if (/already registered/i.test(msg)) return 'An account with this email already exists.';
  if (/network request failed|fetch/i.test(msg)) return 'No internet connection. Please try again.';
  return msg;
}

export function validateCredentials({ email, password }) {
  if (!email?.trim() || !password) return 'Please enter your email and password.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

export function validateRegistration({ firstName, lastName, email, password }) {
  if (!firstName?.trim() || !lastName?.trim()) return 'Please enter your first and last name.';
  const credsError = validateCredentials({ email, password });
  if (credsError) return credsError;
  if (password.length < 8) return 'Password must be at least 8 characters.';
  return null;
}

// Creates the account. The database trigger copies first/last name
// into public.users. Returns { needsEmailConfirmation }.
export async function signUp({ firstName, lastName, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { first_name: firstName.trim(), last_name: lastName.trim() },
    },
  });
  if (error) throw new Error(friendlyMessage(error));

  // Supabase returns a user with no identities when the email is already taken
  // (it hides this on purpose to avoid leaking which emails exist).
  if (data.user && data.user.identities?.length === 0) {
    throw new Error('An account with this email already exists.');
  }

  return { needsEmailConfirmation: !data.session };
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw new Error(friendlyMessage(error));
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(friendlyMessage(error));
}

// The logged-in user's row from public.users (RLS only returns their own).
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, first_name, last_name, role, plan')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(friendlyMessage(error));
  return data;
}
