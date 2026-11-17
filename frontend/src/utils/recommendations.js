// Rule-based recommendations: each finding points at a tip, and each tip
// takes the highest severity of the findings that triggered it.
import { SEVERITY_ORDER } from './riskScoring';

export const TIPS = {
  change_password: {
    title: 'Change your leaked password',
    rationale: 'A password from a breach can be tried on your other accounts. Changing it stops that.',
    steps: ['Change the password on the affected site', 'Change it anywhere you reused it', 'Use a password manager for unique passwords'],
    icon: 'key',
  },
  enable_2fa: {
    title: 'Turn on two-factor authentication',
    rationale: 'Even if someone has your password, a second step (code or app) keeps them out.',
    steps: ['Start with email, banking and social accounts', 'Use an authenticator app instead of SMS when possible'],
    icon: 'phone-portrait',
  },
  watch_phishing: {
    title: 'Watch out for scam messages',
    rationale: 'Leaked emails and phone numbers are used to send convincing fake messages.',
    steps: ['Don’t click links in unexpected messages', 'Check the sender before replying', 'Contact companies through their official app or site'],
    icon: 'mail-unread',
  },
  email_alias: {
    title: 'Use an alias email for sign-ups',
    rationale: 'A separate email for newsletters and shopping keeps your main inbox out of leaks.',
    steps: ['Create a second email or use your provider’s alias feature', 'Use it for shops, newsletters and trials'],
    icon: 'at',
  },
  private_profile: {
    title: 'Make your social profile private',
    rationale: 'Public photos and location tags show where you live, work and spend time.',
    steps: ['Set the account to private', 'Remove location tags from old posts', 'Review who can see your friends list'],
    icon: 'eye-off',
  },
  hide_email_commits: {
    title: 'Hide your email on developer sites',
    rationale: 'Email addresses in public code history are collected by spammers.',
    steps: ['Turn on “keep my email private” in your account settings', 'Use the no-reply address for future commits'],
    icon: 'code-slash',
  },
  vary_usernames: {
    title: 'Use different usernames',
    rationale: 'The same username everywhere makes it easy to link all your accounts together.',
    steps: ['Pick new usernames for accounts that don’t need to be public', 'Keep your main handle only where you want to be found'],
    icon: 'shuffle',
  },
  close_inactive: {
    title: 'Close accounts you no longer use',
    rationale: 'Old accounts often have weak passwords and still hold your personal data.',
    steps: ['Log in and delete the account', 'If you can’t log in, ask the site’s support to remove it'],
    icon: 'trash-bin',
  },
  opt_out: {
    title: 'Opt out of people-search sites',
    rationale: 'These sites sell your name, suburb and relatives to anyone who searches.',
    steps: ['Find the site’s opt-out or removal page', 'Submit a removal request for your listing', 'Check again in a month'],
    icon: 'person-remove',
  },
  remove_public_info: {
    title: 'Remove your details from public pages',
    rationale: 'Contact details on public pages are easy to scrape and reuse.',
    steps: ['Ask the page owner to remove or hide your email', 'Use a contact form instead of a visible address'],
    icon: 'globe',
  },
};

export function buildRecommendations(results) {
  const byKey = new Map();
  for (const r of results) {
    const current = byKey.get(r.tip);
    if (!current || SEVERITY_ORDER.indexOf(r.severity) < SEVERITY_ORDER.indexOf(current.priority)) {
      byKey.set(r.tip, { priority: r.severity });
    }
  }
  return [...byKey.entries()]
    .map(([key, { priority }]) => ({ id: key, key, priority, ...TIPS[key] }))
    .sort((a, b) => SEVERITY_ORDER.indexOf(a.priority) - SEVERITY_ORDER.indexOf(b.priority));
}
