/**
 * AuSuivant dashboard utility functions.
 */

// ─── Doctor color tokens ───

export const TOKEN_COLORS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#E8EEF9', fg: '#1A3C8F' },
  teal: { bg: '#E8F5EE', fg: '#1A7A4A' },
  emerald: { bg: '#E8F5EE', fg: '#1A7A4A' },
  amber: { bg: '#FEF0E6', fg: '#E8712A' },
  plum: { bg: '#EDE6F9', fg: '#5A3C8F' },
  rose: { bg: '#F9E6EA', fg: '#8F3C5A' },
  slate: { bg: '#EDF0F7', fg: '#6B7A99' },
};

export function getTokenColor(token: string) {
  return TOKEN_COLORS[token] || TOKEN_COLORS.slate;
}

/**
 * Format patient name for RGPD display: "Prénom N."
 * Input: "Marie Dupont" → "Marie D."
 * Input: "Marie" → "Marie"
 */
export function formatDisplayName(name: string | null | undefined): string {
  if (!name) return 'Patient';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${firstName} ${lastInitial}.`;
}

/**
 * Format arrival time as "HHhMM" (e.g. "15h51").
 */
export function formatArrivalTime(arrivedAt: string): string {
  const d = new Date(arrivedAt);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}h${m}`;
}

/**
 * Calculate estimated end time from current time + remaining minutes.
 * Returns "~HHhMM" format.
 */
export function calculateEstimatedEndTime(waitingCount: number, avgMins: number): string | null {
  if (waitingCount === 0 || avgMins <= 0) return null;
  const now = new Date();
  const endMs = now.getTime() + waitingCount * avgMins * 60 * 1000;
  const end = new Date(endMs);
  const h = end.getHours();
  const m = end.getMinutes().toString().padStart(2, '0');
  return `~${h}h${m}`;
}

/**
 * Calculate consultation duration in minutes from calledAt timestamp.
 */
export function getConsultationDuration(calledAt: string | null): number {
  if (!calledAt) return 0;
  const start = new Date(calledAt).getTime();
  const now = Date.now();
  return Math.round((now - start) / 60000);
}

/**
 * Format doctor name with "Dr." prefix, avoiding duplication.
 * "Dr. Perrin" → "Dr. Perrin", "Perrin" → "Dr. Perrin"
 */
export function formatDoctorName(name: string | null | undefined): string {
  if (!name) return 'Dr. ?';
  const stripped = name.replace(/^Dr\.?\s*/i, '').trim();
  return `Dr. ${stripped}`;
}

/**
 * Format phone number for display with spaces.
 * France: "X XX XX XX XX"
 */
export function formatPhoneInput(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, 9);
  if (clean.length === 0) return '';
  let formatted = clean.slice(0, 1);
  if (clean.length > 1) formatted += ' ' + clean.slice(1, 3);
  if (clean.length > 3) formatted += ' ' + clean.slice(3, 5);
  if (clean.length > 5) formatted += ' ' + clean.slice(5, 7);
  if (clean.length > 7) formatted += ' ' + clean.slice(7, 9);
  return formatted;
}
