// Authentication calls to Supabase Auth.
// Each function throws an Error with a user-friendly message on failure.
import { Platform } from 'react-native';
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

// Password strength (report FR-01). A password needs 8+ characters and at
// least 3 of the 4 character types to be accepted.
export const PASSWORD_RULES = [
  { key: 'length', label: '8+ characters', test: (p) => p.length >= 8 },
  { key: 'lower', label: 'Lowercase letter', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { key: 'number', label: 'Number', test: (p) => /\d/.test(p) },
  { key: 'symbol', label: 'Symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Returns { score 0–4, label, passed: Set of rule keys, acceptable }.
export function passwordStrength(password = '') {
  const passed = new Set(PASSWORD_RULES.filter((r) => r.test(password)).map((r) => r.key));
  const types = ['lower', 'upper', 'number', 'symbol'].filter((k) => passed.has(k)).length;
  const longEnough = passed.has('length');
  let score = 0;
  if (password.length > 0) score = 1;
  if (longEnough && types >= 2) score = 2;
  if (longEnough && types >= 3) score = 3;
  if (password.length >= 12 && types === 4) score = 4;
  const label = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];
  return { score, label, passed, acceptable: longEnough && types >= 3 };
}

export function validatePassword(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  if (!passwordStrength(password).acceptable) {
    return 'Use at least 3 of: lowercase, uppercase, number, symbol.';
  }
  return null;
}

export function validateRegistration({ firstName, lastName, email, password }) {
  if (!firstName?.trim() || !lastName?.trim()) return 'Please enter your first and last name.';
  const credsError = validateCredentials({ email, password });
  if (credsError) return credsError;
  return validatePassword(password);
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

// Emails a password reset link. Always succeeds from the user's point of
// view so the app never reveals whether an account exists (report 3.4).
export async function sendPasswordReset(email) {
  const clean = email?.trim().toLowerCase();
  if (!clean || !EMAIL_PATTERN.test(clean)) throw new Error('Enter your email address first.');
  // On web the link comes back to this app, which then shows the
  // "Set a new password" screen. The URL must be listed under Supabase →
  // Authentication → URL Configuration → Redirect URLs.
  const options = Platform.OS === 'web' && typeof window !== 'undefined'
    ? { redirectTo: window.location.origin }
    : undefined;
  const { error } = await supabase.auth.resetPasswordForEmail(clean, options);
  if (error && /rate limit/i.test(error.message)) {
    throw new Error('Too many requests. Please wait a minute and try again.');
  }
}

export async function changePassword(newPassword) {
  const problem = validatePassword(newPassword);
  if (problem) throw new Error(problem);
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(friendlyMessage(error));
}

// Users may only edit first_name, last_name and preferences (see migration).
export async function updateProfile(userId, changes) {
  const { data, error } = await supabase
    .from('users')
    .update(changes)
    .eq('user_id', userId)
    .select('user_id, email, first_name, last_name, role, plan, preferences, created_at')
    .single();
  if (error) throw new Error(friendlyMessage(error));
  return data;
}

// The logged-in user's row from public.users (RLS only returns their own).
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, first_name, last_name, role, plan, preferences, created_at')
    .eq('user_id', userId)
    .single();
  if (error) throw new Error(friendlyMessage(error));
  return data;
}
