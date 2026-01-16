/**
 * Shared phone number utilities for Tunisian phone numbers
 * Format: +216 XX XXX XXX (8 digits after country code)
 */

const TUNISIA_COUNTRY_CODE = '+216';
const TUNISIA_PHONE_LENGTH = 8;

/**
 * Format a phone number as "+216 XX XXX XXX"
 * @param value - The input value to format
 * @returns Formatted phone number string
 */
export function formatTunisianPhone(value: string): string {
  const prefix = `${TUNISIA_COUNTRY_CODE} `;

  // If user cleared everything or tries to delete prefix, return the prefix
  if (!value || value.length < 4) {
    return prefix;
  }

  // Remove all non-digit characters
  const allDigits = value.replace(/\D/g, '');

  // Handle case where digits start with 216 (country code)
  let phoneDigits = allDigits;
  if (allDigits.startsWith('216')) {
    phoneDigits = allDigits.slice(3);
  }

  // Limit to 8 digits (Tunisian phone numbers)
  const limitedDigits = phoneDigits.slice(0, TUNISIA_PHONE_LENGTH);

  // If no digits, return just the prefix
  if (limitedDigits.length === 0) {
    return prefix;
  }

  // Build formatted string: +216 XX XXX XXX
  let formatted = prefix;

  // First 2 digits (XX)
  formatted += limitedDigits.slice(0, 2);

  // Next 3 digits (XXX)
  if (limitedDigits.length > 2) {
    formatted += ' ' + limitedDigits.slice(2, 5);
  }

  // Last 3 digits (XXX)
  if (limitedDigits.length > 5) {
    formatted += ' ' + limitedDigits.slice(5, 8);
  }

  return formatted;
}

/**
 * Extract raw phone number for API submission
 * @param formattedPhone - The formatted phone string
 * @returns Phone number in +216XXXXXXXX format
 */
export function extractPhoneDigits(formattedPhone: string): string {
  const digits = formattedPhone.replace(/\D/g, '');
  if (digits.startsWith('216')) {
    return '+' + digits;
  }
  return TUNISIA_COUNTRY_CODE + digits;
}

/**
 * Validate that a phone number has exactly 8 digits (after country code)
 * @param formattedPhone - The formatted phone string
 * @returns true if valid, false otherwise
 */
export function isValidTunisianPhone(formattedPhone: string): boolean {
  const digits = formattedPhone.replace(/\D/g, '');
  const localDigits = digits.startsWith('216') ? digits.slice(3) : digits;
  return localDigits.length === TUNISIA_PHONE_LENGTH;
}

/**
 * Get the local digits (without country code) from a formatted phone
 * @param formattedPhone - The formatted phone string
 * @returns The 8 local digits
 */
export function getLocalDigits(formattedPhone: string): string {
  const digits = formattedPhone.replace(/\D/g, '');
  return digits.startsWith('216') ? digits.slice(3) : digits;
}

/**
 * Default phone value with prefix
 */
export const DEFAULT_PHONE_VALUE = `${TUNISIA_COUNTRY_CODE} `;
