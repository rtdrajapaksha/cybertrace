// CyberTrace design tokens. Every screen reads colours, fonts, spacing and
// radius from here (report NFR-22: tokens, not literal values in screens).
//
// Look: soft light background, white rounded cards, deep teal primary,
// pastel tiles (lavender / peach / mint / sky) and a lime highlight.
import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const light = {
  mode: 'light',
  bg: '#EEF1EF',
  card: '#FFFFFF',
  cardAlt: '#F4F6F5',
  border: '#E2E7E5',
  text: '#132224',
  textMuted: '#667778',
  primary: '#1E4A4C',      // deep teal: hero areas, primary buttons, active tab
  onPrimary: '#FFFFFF',
  onPrimaryMuted: '#B9CDCC',
  lime: '#C8F04D',         // highlight: underlines, active dots, badges
  onLime: '#1E4A4C',
  lavender: '#E4DAFB', lavenderInk: '#5B3FA8',
  peach: '#FBEDE3',    peachInk: '#B0602A',
  mint: '#DCF2E3',     mintInk: '#237A4B',
  sky: '#DDEBF6',      skyInk: '#2C5E86',
  danger: '#C2412D',
  overlay: 'rgba(10, 25, 26, 0.45)',
  risk: {
    LOW:      { fg: '#237A4B', bg: '#DCF2E3', icon: 'shield-checkmark' },
    MEDIUM:   { fg: '#A3620B', bg: '#FCEFD9', icon: 'alert-circle' },
    HIGH:     { fg: '#C2412D', bg: '#FBE3DE', icon: 'warning' },
    CRITICAL: { fg: '#8A1C2B', bg: '#F6D5DA', icon: 'flame' },
  },
};

// Default look: "hacker terminal" — near-black with neon green.
const dark = {
  mode: 'dark',
  bg: '#07110D',
  card: '#0D1F17',
  cardAlt: '#12291F',
  border: '#1C3A2A',
  text: '#E8FFF2',
  textMuted: '#7FA894',
  primary: '#39FF88',
  onPrimary: '#07110D',
  onPrimaryMuted: '#145A33',
  lime: '#39FF88',
  onLime: '#07110D',
  lavender: '#1A1F3A', lavenderInk: '#A9B4FF',
  peach: '#2E1A14',    peachInk: '#FF9B7A',
  mint: '#0F2E1E',     mintInk: '#39FF88',
  sky: '#0F2333',      skyInk: '#6CC8FF',
  danger: '#FF5C7A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  risk: {
    LOW:      { fg: '#39FF88', bg: '#0F2E1E', icon: 'shield-checkmark' },
    MEDIUM:   { fg: '#FFC24B', bg: '#2E2610', icon: 'alert-circle' },
    HIGH:     { fg: '#FF8A5C', bg: '#33190F', icon: 'warning' },
    CRITICAL: { fg: '#FF5C7A', bg: '#3A1220', icon: 'flame' },
  },
};

// Hero areas (landing, auth and scan headers): terminal black in both modes.
export const brand = {
  hero: '#07110D',
  heroText: '#E8FFF2',
  heroMuted: '#7FA894',
  heroField: '#0D1F17',
  accent: '#39FF88',
};

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
});

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
};

// Type scale from the report (Table 11), sizes in sp.
export const type = {
  display: { fontFamily: font.bold, fontSize: 28, lineHeight: 34 },
  h1: { fontFamily: font.bold, fontSize: 24, lineHeight: 30 },
  h2: { fontFamily: font.semibold, fontSize: 20, lineHeight: 26 },
  h3: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: font.medium, fontSize: 16, lineHeight: 24 },
  small: { fontFamily: font.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.semibold, fontSize: 13, lineHeight: 18 },
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { card: 20, tile: 16, button: 14, input: 12, pill: 999 };

const STORAGE_KEY = 'cybertrace:theme:v2';
const ThemeContext = createContext({ colors: dark, setMode: () => {} });

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => { if (saved === 'dark' || saved === 'light') setModeState(saved); })
      .catch(() => {});
  }, []);

  const value = useMemo(() => ({
    colors: mode === 'dark' ? dark : light,
    mode,
    setMode: (next) => {
      setModeState(next);
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    },
  }), [mode]);

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return useContext(ThemeContext);
}
