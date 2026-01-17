/**
 * Unit tests for time utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatTime, getWaitingMinutes, formatDuration } from './time';

describe('formatTime', () => {
  it('should format Date object to HH:MM', () => {
    const date = new Date('2024-01-15T14:30:00');
    expect(formatTime(date)).toBe('14:30');
  });

  it('should format ISO string to HH:MM', () => {
    const isoString = '2024-01-15T09:05:00';
    expect(formatTime(isoString)).toBe('09:05');
  });

  it('should handle midnight', () => {
    const date = new Date('2024-01-15T00:00:00');
    expect(formatTime(date)).toBe('00:00');
  });

  it('should handle noon', () => {
    const date = new Date('2024-01-15T12:00:00');
    expect(formatTime(date)).toBe('12:00');
  });

  it('should handle end of day', () => {
    const date = new Date('2024-01-15T23:59:00');
    expect(formatTime(date)).toBe('23:59');
  });
});

describe('getWaitingMinutes', () => {
  beforeEach(() => {
    // Mock Date.now() to return a fixed time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 for just arrived', () => {
    const arrivedAt = '2024-01-15T10:30:00';
    expect(getWaitingMinutes(arrivedAt)).toBe(0);
  });

  it('should return correct minutes for short wait', () => {
    const arrivedAt = '2024-01-15T10:15:00';
    expect(getWaitingMinutes(arrivedAt)).toBe(15);
  });

  it('should return correct minutes for longer wait', () => {
    const arrivedAt = '2024-01-15T09:00:00';
    expect(getWaitingMinutes(arrivedAt)).toBe(90);
  });

  it('should floor partial minutes', () => {
    // Arrived 5 minutes and 45 seconds ago
    const arrivedAt = '2024-01-15T10:24:15';
    expect(getWaitingMinutes(arrivedAt)).toBe(5);
  });
});

describe('formatDuration', () => {
  it('should format minutes under an hour', () => {
    expect(formatDuration(15)).toBe('15min');
    expect(formatDuration(45)).toBe('45min');
    expect(formatDuration(59)).toBe('59min');
  });

  it('should format exactly one hour', () => {
    expect(formatDuration(60)).toBe('1h');
  });

  it('should format hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min');
    expect(formatDuration(75)).toBe('1h 15min');
    expect(formatDuration(125)).toBe('2h 5min');
  });

  it('should format multiple hours without remaining minutes', () => {
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(180)).toBe('3h');
  });

  it('should handle zero minutes', () => {
    expect(formatDuration(0)).toBe('0min');
  });

  it('should handle single minute', () => {
    expect(formatDuration(1)).toBe('1min');
  });
});
