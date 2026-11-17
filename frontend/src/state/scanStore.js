// Scan history for the logged-in user.
// Demo mode: scans are saved on this device (AsyncStorage), per user.
// Later these will come from the scans table in Supabase.
import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './authStore';

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user ? `cybertrace:scans:${user.id}` : null;
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (!storageKey) { setScans([]); setLoading(false); return; }
    AsyncStorage.getItem(storageKey)
      .then((raw) => setScans(raw ? JSON.parse(raw) : []))
      .catch(() => setScans([]))
      .finally(() => setLoading(false));
  }, [storageKey]);

  const save = useCallback((updater) => {
    setScans((prev) => {
      const next = updater(prev);
      if (storageKey) AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [storageKey]);

  const value = useMemo(() => ({
    scans, // newest first
    loading,
    latest: scans[0] ?? null,
    getScan: (id) => scans.find((s) => s.scan_id === id) ?? null,
    addScan: (scan) => save((prev) => [scan, ...prev]),
    deleteScan: (id) => save((prev) => prev.filter((s) => s.scan_id !== id)),
    clearScans: () => save(() => []),
    toggleTip: (scanId, tipKey) => save((prev) => prev.map((s) => {
      if (s.scan_id !== scanId) return s;
      const done = new Set(s.completedTips);
      if (done.has(tipKey)) done.delete(tipKey); else done.add(tipKey);
      return { ...s, completedTips: [...done] };
    })),
  }), [scans, loading, save]);

  return createElement(ScanContext.Provider, { value }, children);
}

export function useScans() {
  return useContext(ScanContext);
}
