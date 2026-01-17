/**
 * Unit tests for phone utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatTunisianPhone,
  extractPhoneDigits,
  isValidTunisianPhone,
  getLocalDigits,
  DEFAULT_PHONE_VALUE,
} from './phone';

describe('formatTunisianPhone', () => {
  it('should return prefix for empty input', () => {
    expect(formatTunisianPhone('')).toBe('+216 ');
  });

  it('should return prefix for short input', () => {
    expect(formatTunisianPhone('21')).toBe('+216 ');
  });

  it('should format 8 digits correctly', () => {
    expect(formatTunisianPhone('98123456')).toBe('+216 98 123 456');
  });

  it('should handle input with country code', () => {
    expect(formatTunisianPhone('21698123456')).toBe('+216 98 123 456');
  });

  it('should handle input with + prefix', () => {
    expect(formatTunisianPhone('+21698123456')).toBe('+216 98 123 456');
  });

  it('should strip non-digit characters', () => {
    expect(formatTunisianPhone('+216 98 123 456')).toBe('+216 98 123 456');
  });

  it('should limit to 8 digits after country code', () => {
    expect(formatTunisianPhone('9812345678901234')).toBe('+216 98 123 456');
  });

  it('should handle partial phone numbers', () => {
    // Input less than 4 chars returns prefix only
    expect(formatTunisianPhone('98')).toBe('+216 ');
    expect(formatTunisianPhone('981')).toBe('+216 ');
    // Input 4+ chars starts formatting
    expect(formatTunisianPhone('9812')).toBe('+216 98 12');
    expect(formatTunisianPhone('98123')).toBe('+216 98 123');
    expect(formatTunisianPhone('981234')).toBe('+216 98 123 4');
  });
});

describe('extractPhoneDigits', () => {
  it('should extract digits and add country code', () => {
    expect(extractPhoneDigits('+216 98 123 456')).toBe('+21698123456');
  });

  it('should handle already formatted phone', () => {
    expect(extractPhoneDigits('+21698123456')).toBe('+21698123456');
  });

  it('should add country code if missing', () => {
    expect(extractPhoneDigits('98123456')).toBe('+21698123456');
  });
});

describe('isValidTunisianPhone', () => {
  it('should return true for valid 8-digit phone', () => {
    expect(isValidTunisianPhone('+216 98 123 456')).toBe(true);
    expect(isValidTunisianPhone('21698123456')).toBe(true);
    expect(isValidTunisianPhone('98123456')).toBe(true);
  });

  it('should return false for short phone numbers', () => {
    expect(isValidTunisianPhone('+216 98 123')).toBe(false);
    expect(isValidTunisianPhone('9812345')).toBe(false);
  });

  it('should return false for long phone numbers', () => {
    expect(isValidTunisianPhone('+216 98 123 4567')).toBe(false);
    expect(isValidTunisianPhone('981234567')).toBe(false);
  });

  it('should return false for empty input', () => {
    expect(isValidTunisianPhone('')).toBe(false);
    expect(isValidTunisianPhone('+216 ')).toBe(false);
  });
});

describe('getLocalDigits', () => {
  it('should extract 8 local digits', () => {
    expect(getLocalDigits('+216 98 123 456')).toBe('98123456');
    expect(getLocalDigits('21698123456')).toBe('98123456');
  });

  it('should return digits as-is if no country code', () => {
    expect(getLocalDigits('98123456')).toBe('98123456');
  });
});

describe('DEFAULT_PHONE_VALUE', () => {
  it('should be the Tunisia prefix with space', () => {
    expect(DEFAULT_PHONE_VALUE).toBe('+216 ');
  });
});
