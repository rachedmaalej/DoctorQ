/**
 * Shared time formatting utilities
 */

/**
 * Format time from ISO string or Date to HH:MM
 * @param dateInput - ISO date string or Date object
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Calculate waiting time in minutes from arrival time
 * @param arrivedAt - ISO string of arrival time
 * @returns Number of minutes elapsed
 */
export function getWaitingMinutes(arrivedAt: string): number {
  const arrived = new Date(arrivedAt);
  const now = new Date();
  const diffMs = now.getTime() - arrived.getTime();
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Format minutes as human-readable duration
 * @param minutes - Number of minutes
 * @returns Formatted string (e.g., "15min" or "1h 30min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}min`;
}
