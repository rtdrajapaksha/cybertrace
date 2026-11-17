// Rule-based risk scoring from the Capstone report (pseudocode 4.2.6).
// Each finding adds points by severity; the total is capped at 100.
export const SEVERITY_POINTS = { HIGH: 25, MEDIUM: 10, LOW: 5 };
export const SEVERITY_ORDER = ['HIGH', 'MEDIUM', 'LOW'];

export function calculateRiskScore(results) {
  const total = results.reduce((sum, r) => sum + (SEVERITY_POINTS[r.severity] || 0), 0);
  return Math.min(total, 100);
}

export function riskLevelFor(score) {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

export const RISK_COPY = {
  LOW: { label: 'Low risk', summary: 'Your public footprint is small. Keep it that way with a few good habits.' },
  MEDIUM: { label: 'Medium risk', summary: 'Some of your information is public. A few quick fixes will lower your risk.' },
  HIGH: { label: 'High risk', summary: 'Important details about you are exposed. Work through the tips below soon.' },
  CRITICAL: { label: 'Critical risk', summary: 'Sensitive information is exposed in several places. Start with the top tips now.' },
};

export const CATEGORY_COPY = {
  DATA_BREACH: { label: 'Data breaches', icon: 'lock-open', tone: 'peach' },
  SOCIAL_MEDIA: { label: 'Social media', icon: 'people', tone: 'lavender' },
  PUBLIC_RECORD: { label: 'Public records', icon: 'document-text', tone: 'sky' },
};
