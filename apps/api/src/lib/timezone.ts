/**
 * Timezone utilities.
 * DST-aware — works correctly for both Africa/Tunis (no DST)
 * and Europe/Paris (UTC+1 winter, UTC+2 summer).
 */

import { brand } from './brand.js';

/**
 * Get the current UTC offset in minutes for the brand's timezone.
 * Handles DST automatically via Intl.
 */
export function getTimezoneOffsetMinutes(date: Date = new Date()): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone: brand.timezone });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

/**
 * Get start of today in the brand's timezone.
 * Returns the UTC Date that corresponds to midnight in the configured timezone.
 */
export function getStartOfToday(): Date {
  const now = new Date();
  const offsetMins = getTimezoneOffsetMinutes(now);
  const localTime = new Date(now.getTime() + offsetMins * 60000);
  const year = localTime.getUTCFullYear();
  const month = localTime.getUTCMonth();
  const day = localTime.getUTCDate();
  return new Date(Date.UTC(year, month, day) - offsetMins * 60000);
}

/**
 * Get start of the current month in the brand's timezone.
 * Returns the UTC Date that corresponds to midnight on the 1st.
 */
export function getStartOfMonth(): Date {
  const now = new Date();
  const offsetMins = getTimezoneOffsetMinutes(now);
  const localTime = new Date(now.getTime() + offsetMins * 60000);
  const year = localTime.getUTCFullYear();
  const month = localTime.getUTCMonth();
  return new Date(Date.UTC(year, month, 1) - offsetMins * 60000);
}

/**
 * Convert a local time (hours, minutes) on today's date to a UTC Date.
 * Useful for parsing appointment times like "14:30" in the brand's timezone.
 */
export function localTimeToUtc(hours: number, minutes: number): Date {
  const now = new Date();
  const offsetMins = getTimezoneOffsetMinutes(now);
  const localTime = new Date(now.getTime() + offsetMins * 60000);
  const year = localTime.getUTCFullYear();
  const month = localTime.getUTCMonth();
  const day = localTime.getUTCDate();
  return new Date(Date.UTC(year, month, day, hours, minutes, 0, 0) - offsetMins * 60000);
}
