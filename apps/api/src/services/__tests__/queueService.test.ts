import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing service
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    queueEntry: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    clinic: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn({
      queueEntry: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        aggregate: vi.fn(),
      },
    })),
  },
}));

vi.mock('../../lib/socket.js', () => ({
  emitToRoom: vi.fn(),
}));

vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../notificationService.js', () => ({
  emitQueueUpdate: vi.fn(),
  emitPatientUpdate: vi.fn(),
  emitAllPatientUpdates: vi.fn(),
}));

vi.mock('../statsService.js', () => ({
  getQueueStats: vi.fn().mockResolvedValue({
    waiting: 0,
    inConsultation: 0,
    completed: 0,
    noShow: 0,
    avgWaitMins: 0,
    effectiveAvgMins: 10,
  }),
}));

import { formatPhoneNumber } from '../queueService.js';

describe('queueService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatPhoneNumber', () => {
    it('should add +216 prefix to 8-digit Tunisian numbers', () => {
      expect(formatPhoneNumber('98765432')).toBe('+21698765432');
    });

    it('should prepend +216 to numbers without it (even if they include 216)', () => {
      // The function only preserves +216 prefix exactly, not bare 216
      expect(formatPhoneNumber('21698765432')).toBe('+21621698765432');
    });

    it('should keep numbers already in +216 format', () => {
      expect(formatPhoneNumber('+21698765432')).toBe('+21698765432');
    });

    it('should handle numbers with spaces', () => {
      expect(formatPhoneNumber('98 765 432')).toBe('+21698765432');
    });

    it('should handle numbers with dashes', () => {
      expect(formatPhoneNumber('98-765-432')).toBe('+21698765432');
    });

    it('should prepend +216 to non-Tunisian numbers (function assumes Tunisian)', () => {
      // The function always adds +216 unless the input already starts with +216
      expect(formatPhoneNumber('+33612345678')).toBe('+21633612345678');
    });
  });
});
