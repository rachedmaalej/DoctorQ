import type { ActivitySeverity } from './types';

/** Extract 1-2 letter initials from a name */
export function getInitials(name: string): string {
  const words = name
    .replace(/^(dr\.?|cabinet|clinique|centre)\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Format a timestamp as relative time */
export function formatRelativeTime(timestamp: string, locale: 'en' | 'fr' = 'en'): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === 'fr' ? "A l'instant" : 'Just now';
  if (mins < 60) return locale === 'fr' ? `Il y a ${mins}m` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale === 'fr' ? `Il y a ${hours}h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === 'fr' ? `Il y a ${days}j` : `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US');
}

/** Format currency based on brand */
export function formatCurrency(amount: number, currency: 'TND' | 'EUR'): string {
  if (currency === 'EUR') {
    const formatted = new Intl.NumberFormat('fr-FR').format(amount);
    return `${formatted} \u20AC`;
  }
  const formatted = new Intl.NumberFormat('en-US').format(amount);
  return `${formatted} TND`;
}

/** Format number with locale-appropriate separator */
export function formatNumber(n: number, locale: 'en' | 'fr' = 'en'): string {
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US').format(n);
}

/** Map activity event type to severity */
export function getSeverityFromType(type: string): ActivitySeverity {
  switch (type) {
    case 'clinic_active':
    case 'plan_upgrade':
    case 'new_trial_started':
    case 'payment_success':
    case 'subscription_activated':
    case 'high_volume':
      return 'success';
    case 'trial_expiring':
    case 'trial_extended':
      return 'warning';
    case 'no_login':
    case 'trial_expired':
    case 'subscription_expired':
    case 'payment_failed':
    case 'subscription_cancelled':
      return 'danger';
    default:
      return 'info';
  }
}

/** Join class names, filtering falsy values */
export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
