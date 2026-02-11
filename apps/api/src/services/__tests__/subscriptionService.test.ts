import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma before importing the service
vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    clinic: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../lib/konnect.js', () => ({
  initPayment: vi.fn(),
  getPaymentDetails: vi.fn(),
}));

vi.mock('../../lib/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { getSubscriptionStatus } from '../subscriptionService.js';
import { prisma } from '../../lib/prisma.js';

const mockFindUnique = vi.mocked(prisma.clinic.findUnique);

describe('getSubscriptionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw CLINIC_NOT_FOUND for unknown clinic', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(getSubscriptionStatus('unknown-id')).rejects.toThrow('Clinic not found');
  });

  it('should return canUseApp=true for TRIAL status', async () => {
    const trialEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'TRIAL',
      subscriptionPlan: null,
      trialEndsAt,
      subscriptionEndsAt: null,
      smsCredits: 50,
    } as any);

    const result = await getSubscriptionStatus('clinic-1');

    expect(result.status).toBe('TRIAL');
    expect(result.canUseApp).toBe(true);
    expect(result.plan).toBeNull();
    expect(result.smsCredits).toBe(50);
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('should return canUseApp=true for ACTIVE status', async () => {
    const subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'MONTHLY',
      trialEndsAt: null,
      subscriptionEndsAt,
      smsCredits: 100,
    } as any);

    const result = await getSubscriptionStatus('clinic-1');

    expect(result.status).toBe('ACTIVE');
    expect(result.canUseApp).toBe(true);
    expect(result.plan).toBe('MONTHLY');
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('should return canUseApp=true for PAST_DUE status', async () => {
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'PAST_DUE',
      subscriptionPlan: 'YEARLY',
      trialEndsAt: null,
      subscriptionEndsAt: new Date(Date.now() - 1000), // past
      smsCredits: 10,
    } as any);

    const result = await getSubscriptionStatus('clinic-1');

    expect(result.status).toBe('PAST_DUE');
    expect(result.canUseApp).toBe(true);
  });

  it('should return canUseApp=false for EXPIRED status', async () => {
    // EXPIRED is not 'TRIAL', so getDaysRemaining uses subscriptionEndsAt
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'EXPIRED',
      subscriptionPlan: null,
      trialEndsAt: null,
      subscriptionEndsAt: pastDate,
      smsCredits: 0,
    } as any);

    const result = await getSubscriptionStatus('clinic-1');

    expect(result.status).toBe('EXPIRED');
    expect(result.canUseApp).toBe(false);
    expect(result.daysRemaining).toBe(0);
  });

  it('should use trialEndsAt for TRIAL and subscriptionEndsAt for ACTIVE', async () => {
    const trialEndsAt = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const subscriptionEndsAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // TRIAL should use trialEndsAt
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'TRIAL',
      subscriptionPlan: null,
      trialEndsAt,
      subscriptionEndsAt,
      smsCredits: 50,
    } as any);

    const trialResult = await getSubscriptionStatus('clinic-1');
    expect(trialResult.daysRemaining).toBeLessThanOrEqual(11);
    expect(trialResult.daysRemaining).toBeGreaterThanOrEqual(9);

    // ACTIVE should use subscriptionEndsAt
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: 'MONTHLY',
      trialEndsAt,
      subscriptionEndsAt,
      smsCredits: 50,
    } as any);

    const activeResult = await getSubscriptionStatus('clinic-1');
    expect(activeResult.daysRemaining).toBeGreaterThanOrEqual(59);
    expect(activeResult.daysRemaining).toBeLessThanOrEqual(61);
  });

  it('should return null daysRemaining when no end date exists', async () => {
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'EXPIRED',
      subscriptionPlan: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      smsCredits: 0,
    } as any);

    const result = await getSubscriptionStatus('clinic-1');
    expect(result.daysRemaining).toBeNull();
  });
});
