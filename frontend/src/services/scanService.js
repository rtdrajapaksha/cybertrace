// Scan service.
//
// DEMO MODE: the backend scanner isn't built yet, so runScan() simulates a
// scan with realistic progress and sample findings. The same identifier
// always gives the same results. When the backend is ready, replace
// runScan() with a call to the API; screens won't need to change.
import { calculateRiskScore, riskLevelFor } from '../utils/riskScoring';
import { buildRecommendations } from '../utils/recommendations';

export const DEMO_MODE = true;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,30}$/;

export function validateIdentifier(value, type) {
  const v = value.trim();
  if (!v) return type === 'EMAIL' ? 'Enter an email address to scan.' : 'Enter a username to scan.';
  if (type === 'EMAIL' && !EMAIL_PATTERN.test(v)) return 'That doesn’t look like a valid email address.';
  if (type === 'USERNAME' && !USERNAME_PATTERN.test(v)) {
    return 'Usernames are 3–30 characters: letters, numbers, dots, dashes or underscores.';
  }
  return null;
}

export const SCAN_STEPS = [
  { key: 'breach', label: 'Checking data breaches', icon: 'lock-open' },
  { key: 'social', label: 'Searching social platforms', icon: 'people' },
  { key: 'public', label: 'Looking up public records', icon: 'document-text' },
  { key: 'score', label: 'Calculating your risk score', icon: 'speedometer' },
];

// Sample findings. Source names are generic on purpose: this is demo data.
const POOL = [
  { for: 'EMAIL', category: 'DATA_BREACH', severity: 'HIGH', tip: 'change_password',
    title: 'Password exposed in a forum leak', source: 'Gaming forum leak · 2019',
    exposed: ['Email', 'Password (hashed)', 'Username'] },
  { for: 'EMAIL', category: 'DATA_BREACH', severity: 'HIGH', tip: 'enable_2fa',
    title: 'Email found in a credential list', source: 'Combined credential list · 2023',
    exposed: ['Email', 'Password'] },
  { for: 'EMAIL', category: 'DATA_BREACH', severity: 'MEDIUM', tip: 'watch_phishing',
    title: 'Contact details in a shop breach', source: 'Online store breach · 2021',
    exposed: ['Email', 'Phone number', 'Postal address'] },
  { for: 'EMAIL', category: 'DATA_BREACH', severity: 'LOW', tip: 'email_alias',
    title: 'Email in a mailing list leak', source: 'Marketing list leak · 2020',
    exposed: ['Email', 'Name'] },
  { for: 'BOTH', category: 'SOCIAL_MEDIA', severity: 'MEDIUM', tip: 'private_profile',
    title: 'Public profile on a photo app', source: 'Photo-sharing platform',
    exposed: ['Full name', 'Photos', 'Location tags'] },
  { for: 'USERNAME', category: 'SOCIAL_MEDIA', severity: 'MEDIUM', tip: 'vary_usernames',
    title: 'Same username on 6 sites', source: 'Username search',
    exposed: ['Username', 'Linked accounts'] },
  { for: 'BOTH', category: 'SOCIAL_MEDIA', severity: 'LOW', tip: 'hide_email_commits',
    title: 'Public developer profile', source: 'Code-hosting site',
    exposed: ['Username', 'Email in commits'] },
  { for: 'USERNAME', category: 'SOCIAL_MEDIA', severity: 'LOW', tip: 'close_inactive',
    title: 'Old account still active', source: 'Discussion forum · last active 2018',
    exposed: ['Username', 'Old posts'] },
  { for: 'BOTH', category: 'PUBLIC_RECORD', severity: 'MEDIUM', tip: 'opt_out',
    title: 'Listed on a people-search site', source: 'People-search directory',
    exposed: ['Full name', 'Suburb', 'Age range'] },
  { for: 'EMAIL', category: 'PUBLIC_RECORD', severity: 'LOW', tip: 'remove_public_info',
    title: 'Email visible on a public web page', source: 'Public web page',
    exposed: ['Email'] },
];

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickFindings(identifier, type) {
  const seed = hash(identifier.toLowerCase());
  const eligible = POOL.filter((f) => f.for === 'BOTH' || f.for === type);
  let picked = eligible.filter((_, i) => (seed >> i) & 1);
  if (picked.length < 2) picked = eligible.slice(0, 2 + (seed % 3));
  return picked.map((f, i) => ({
    result_id: `${seed}-${i}`,
    category: f.category,
    severity: f.severity,
    title: f.title,
    source: f.source,
    exposed: f.exposed,
    tip: f.tip,
  }));
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// onProgress(stepIndex, percent) is called as the scan moves along.
// Pass an object with { cancelled: true } as `signal` to stop early.
export async function runScan({ identifier, type, onProgress, signal }) {
  const startedAt = new Date().toISOString();
  for (let step = 0; step < SCAN_STEPS.length; step += 1) {
    for (let tick = 1; tick <= 10; tick += 1) {
      if (signal?.cancelled) throw new Error('cancelled');
      await wait(110);
      onProgress?.(step, Math.round(((step * 10 + tick) / (SCAN_STEPS.length * 10)) * 100));
    }
  }

  const results = pickFindings(identifier.trim(), type);
  const riskScore = calculateRiskScore(results);
  return {
    scan_id: `demo-${Date.now()}`,
    identifier: identifier.trim(),
    identifier_type: type,
    status: 'COMPLETED',
    risk_score: riskScore,
    risk_level: riskLevelFor(riskScore),
    created_at: startedAt,
    completed_at: new Date().toISOString(),
    results,
    recommendations: buildRecommendations(results),
    completedTips: [],
    demo: DEMO_MODE,
  };
}
