/**
 * Shared phone number utilities.
 * Uses brand config for country code and local digit length.
 */

import { webBrand } from './brand';

const COUNTRY_CODE = webBrand.phone.countryCode;
const COUNTRY_CODE_DIGITS = webBrand.phone.countryCodeDigits;
const LOCAL_DIGITS = webBrand.phone.localDigits;

/**
 * Format a phone number for display.
 * Tunisia: "+216 XX XXX XXX" (8 digits)
 * France:  "+33 X XX XX XX XX" (9 digits)
 */
export function formatPhone(value: string): string {
  const prefix = `${COUNTRY_CODE} `;

  if (!value || value.length < COUNTRY_CODE.length) {
    return prefix;
  }

  // Remove all non-digit characters
  const allDigits = value.replace(/\D/g, '');

  // Strip country code digits if present
  let phoneDigits = allDigits;
  if (allDigits.startsWith(COUNTRY_CODE_DIGITS)) {
    phoneDigits = allDigits.slice(COUNTRY_CODE_DIGITS.length);
  }

  const limitedDigits = phoneDigits.slice(0, LOCAL_DIGITS);

  if (limitedDigits.length === 0) {
    return prefix;
  }

  // Format based on country
  if (webBrand.country === 'FR') {
    // +33 X XX XX XX XX
    let formatted = prefix;
    formatted += limitedDigits.slice(0, 1);
    if (limitedDigits.length > 1) formatted += ' ' + limitedDigits.slice(1, 3);
    if (limitedDigits.length > 3) formatted += ' ' + limitedDigits.slice(3, 5);
    if (limitedDigits.length > 5) formatted += ' ' + limitedDigits.slice(5, 7);
    if (limitedDigits.length > 7) formatted += ' ' + limitedDigits.slice(7, 9);
    return formatted;
  }

  // Default: Tunisia +216 XX XXX XXX
  let formatted = prefix;
  formatted += limitedDigits.slice(0, 2);
  if (limitedDigits.length > 2) formatted += ' ' + limitedDigits.slice(2, 5);
  if (limitedDigits.length > 5) formatted += ' ' + limitedDigits.slice(5, 8);
  return formatted;
}

/**
 * Extract raw phone number for API submission.
 * Returns phone in +CCXXXXXXXX format.
 */
export function extractPhoneDigits(formattedPhone: string): string {
  const digits = formattedPhone.replace(/\D/g, '');
  if (digits.startsWith(COUNTRY_CODE_DIGITS)) {
    return '+' + digits;
  }
  return COUNTRY_CODE + digits;
}

/**
 * Validate that a phone number has the correct number of local digits.
 */
export function isValidPhone(formattedPhone: string): boolean {
  const digits = formattedPhone.replace(/\D/g, '');
  const localDigits = digits.startsWith(COUNTRY_CODE_DIGITS)
    ? digits.slice(COUNTRY_CODE_DIGITS.length)
    : digits;
  return localDigits.length === LOCAL_DIGITS;
}

/**
 * Get the local digits (without country code) from a formatted phone.
 */
export function getLocalDigits(formattedPhone: string): string {
  const digits = formattedPhone.replace(/\D/g, '');
  return digits.startsWith(COUNTRY_CODE_DIGITS)
    ? digits.slice(COUNTRY_CODE_DIGITS.length)
    : digits;
}

/**
 * Default phone value with prefix.
 */
export const DEFAULT_PHONE_VALUE = `${COUNTRY_CODE} `;

// Legacy aliases for backward compatibility during transition
export const formatTunisianPhone = formatPhone;
export const isValidTunisianPhone = isValidPhone;
