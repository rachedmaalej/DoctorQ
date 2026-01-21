/**
 * Unit tests for queue calculation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEstimatedWait,
  formatWaitTime,
  getQueueDisplayPosition,
  isEmergencyMove,
  recalculatePositions,
  getNextPatient,
  countByStatus,
} from './queue';

describe('calculateEstimatedWait', () => {
  it('should return 0 for position 1 (next to be called)', () => {
    expect(calculateEstimatedWait(1, 15)).toBe(0);
  });

  it('should return avgConsultation for position 2 (one person ahead)', () => {
    expect(calculateEstimatedWait(2, 15)).toBe(15);
  });

  it('should multiply patients ahead by avg consultation time', () => {
    expect(calculateEstimatedWait(5, 15)).toBe(60); // 4 people ahead * 15min
    expect(calculateEstimatedWait(5, 20)).toBe(80); // 4 people ahead * 20min
  });

  it('should handle position 0 (edge case)', () => {
    expect(calculateEstimatedWait(0, 15)).toBe(0);
  });

  it('should handle negative position (edge case)', () => {
    expect(calculateEstimatedWait(-1, 15)).toBe(0);
  });

  it('should use default avgConsultationMins of 10', () => {
    expect(calculateEstimatedWait(3)).toBe(20); // 2 people ahead * 10min default
  });

  it('should handle large queue positions', () => {
    expect(calculateEstimatedWait(20, 15)).toBe(285); // 19 people ahead * 15min
  });
});

describe('formatWaitTime', () => {
  it('should return "< 5 min" for very short waits', () => {
    expect(formatWaitTime(0)).toBe('< 5 min');
    expect(formatWaitTime(1)).toBe('< 5 min');
    expect(formatWaitTime(4)).toBe('< 5 min');
  });

  it('should format minutes under an hour with ~ prefix', () => {
    expect(formatWaitTime(5)).toBe('~5 min');
    expect(formatWaitTime(15)).toBe('~15 min');
    expect(formatWaitTime(30)).toBe('~30 min');
    expect(formatWaitTime(59)).toBe('~59 min');
  });

  it('should format exactly one hour', () => {
    expect(formatWaitTime(60)).toBe('~1h');
  });

  it('should format hours with remaining minutes', () => {
    expect(formatWaitTime(75)).toBe('~1h 15min');
    expect(formatWaitTime(90)).toBe('~1h 30min');
    expect(formatWaitTime(125)).toBe('~2h 5min');
  });

  it('should format multiple hours without remaining minutes', () => {
    expect(formatWaitTime(120)).toBe('~2h');
    expect(formatWaitTime(180)).toBe('~3h');
  });
});

describe('getQueueDisplayPosition', () => {
  it('should return 1 for position 2 (first in waiting queue)', () => {
    expect(getQueueDisplayPosition(2)).toBe(1);
  });

  it('should subtract 1 from positions > 1', () => {
    expect(getQueueDisplayPosition(3)).toBe(2);
    expect(getQueueDisplayPosition(5)).toBe(4);
    expect(getQueueDisplayPosition(10)).toBe(9);
  });

  it('should return 1 for position 1 (in consultation - edge case)', () => {
    expect(getQueueDisplayPosition(1)).toBe(1);
  });

  it('should return 1 for position 0 (edge case)', () => {
    expect(getQueueDisplayPosition(0)).toBe(1);
  });
});

describe('isEmergencyMove', () => {
  it('should return true when moving to position 1 from far back', () => {
    expect(isEmergencyMove(1, 5)).toBe(true);
    expect(isEmergencyMove(1, 10)).toBe(true);
    expect(isEmergencyMove(1, 3)).toBe(true);
  });

  it('should return false when moving to position 1 from position 2', () => {
    expect(isEmergencyMove(1, 2)).toBe(false);
  });

  it('should return false when moving to position 1 from position 1', () => {
    expect(isEmergencyMove(1, 1)).toBe(false);
  });

  it('should return false when not moving to position 1', () => {
    expect(isEmergencyMove(2, 5)).toBe(false);
    expect(isEmergencyMove(3, 10)).toBe(false);
  });
});

describe('recalculatePositions', () => {
  it('should decrement positions after removed position', () => {
    const queue = [
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
      { id: 'c', position: 3 },
      { id: 'd', position: 4 },
    ];

    const result = recalculatePositions(queue, 2);

    expect(result).toEqual([
      { id: 'a', position: 1 },
      { id: 'b', position: 2 }, // unchanged (same position)
      { id: 'c', position: 2 }, // was 3, now 2
      { id: 'd', position: 3 }, // was 4, now 3
    ]);
  });

  it('should not change positions before removed position', () => {
    const queue = [
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
      { id: 'c', position: 3 },
    ];

    const result = recalculatePositions(queue, 3);

    expect(result[0].position).toBe(1);
    expect(result[1].position).toBe(2);
    expect(result[2].position).toBe(3); // unchanged (same position)
  });

  it('should handle empty queue', () => {
    expect(recalculatePositions([], 1)).toEqual([]);
  });

  it('should handle removing first position', () => {
    const queue = [
      { id: 'a', position: 1 },
      { id: 'b', position: 2 },
    ];

    const result = recalculatePositions(queue, 1);

    expect(result[0].position).toBe(1); // unchanged (same position)
    expect(result[1].position).toBe(1); // was 2, now 1
  });
});

describe('getNextPatient', () => {
  it('should return first WAITING patient', () => {
    const queue = [
      { id: 'a', status: 'IN_CONSULTATION' },
      { id: 'b', status: 'WAITING' },
      { id: 'c', status: 'WAITING' },
    ];

    expect(getNextPatient(queue)).toEqual({ id: 'b', status: 'WAITING' });
  });

  it('should return first NOTIFIED patient if no WAITING', () => {
    const queue = [
      { id: 'a', status: 'IN_CONSULTATION' },
      { id: 'b', status: 'NOTIFIED' },
      { id: 'c', status: 'WAITING' },
    ];

    expect(getNextPatient(queue)).toEqual({ id: 'b', status: 'NOTIFIED' });
  });

  it('should return NOTIFIED over WAITING based on order', () => {
    const queue = [
      { id: 'a', status: 'IN_CONSULTATION' },
      { id: 'b', status: 'NOTIFIED' },
      { id: 'c', status: 'WAITING' },
    ];

    const result = getNextPatient(queue);
    expect(result?.id).toBe('b');
  });

  it('should return undefined if no WAITING or NOTIFIED', () => {
    const queue = [
      { id: 'a', status: 'IN_CONSULTATION' },
      { id: 'b', status: 'COMPLETED' },
    ];

    expect(getNextPatient(queue)).toBeUndefined();
  });

  it('should return undefined for empty queue', () => {
    expect(getNextPatient([])).toBeUndefined();
  });
});

describe('countByStatus', () => {
  const queue = [
    { id: 'a', status: 'WAITING' },
    { id: 'b', status: 'WAITING' },
    { id: 'c', status: 'NOTIFIED' },
    { id: 'd', status: 'IN_CONSULTATION' },
    { id: 'e', status: 'COMPLETED' },
  ];

  it('should count single status', () => {
    expect(countByStatus(queue, 'WAITING')).toBe(2);
    expect(countByStatus(queue, 'NOTIFIED')).toBe(1);
    expect(countByStatus(queue, 'COMPLETED')).toBe(1);
  });

  it('should count multiple statuses', () => {
    expect(countByStatus(queue, 'WAITING', 'NOTIFIED')).toBe(3);
    expect(countByStatus(queue, 'WAITING', 'IN_CONSULTATION')).toBe(3);
  });

  it('should return 0 for non-existent status', () => {
    expect(countByStatus(queue, 'NO_SHOW')).toBe(0);
  });

  it('should return 0 for empty queue', () => {
    expect(countByStatus([], 'WAITING')).toBe(0);
  });
});
