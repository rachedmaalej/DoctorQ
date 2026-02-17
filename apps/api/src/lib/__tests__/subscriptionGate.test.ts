import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionGate } from '../subscriptionGate.js';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';

// Mock the subscription service
vi.mock('../../services/subscriptionService.js', () => ({
  getSubscriptionStatus: vi.fn(),
}));

import { getSubscriptionStatus } from '../../services/subscriptionService.js';

const mockGetSubscriptionStatus = vi.mocked(getSubscriptionStatus);

function createMockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    method: 'POST',
    clinic: { id: 'clinic-1', email: 'test@test.com', name: 'Test Clinic' },
    ...overrides,
  } as AuthRequest;
}

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

describe('subscriptionGate', () => {
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    next = vi.fn() as unknown as NextFunction;
  });

  it('should allow GET requests through without checking subscription', async () => {
    const req = createMockReq({ method: 'GET' });
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockGetSubscriptionStatus).not.toHaveBeenCalled();
  });

  it('should return 401 if no clinic ID is present', async () => {
    const req = createMockReq({ clinic: undefined });
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow POST requests when subscription is ACTIVE', async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      status: 'ACTIVE',
      plan: 'MONTHLY',
      trialEndsAt: null,
      subscriptionEndsAt: '2026-12-31T00:00:00.000Z',
      daysRemaining: 300,

      canUseApp: true,
    });

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow POST requests when subscription is TRIAL', async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      status: 'TRIAL',
      plan: null,
      trialEndsAt: '2026-03-01T00:00:00.000Z',
      subscriptionEndsAt: null,
      daysRemaining: 20,

      canUseApp: true,
    });

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block POST requests when subscription is EXPIRED', async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      status: 'EXPIRED',
      plan: null,
      trialEndsAt: '2026-01-01T00:00:00.000Z',
      subscriptionEndsAt: null,
      daysRemaining: 0,

      canUseApp: false,
    });

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please upgrade to continue.',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail-open if subscription check throws an error', async () => {
    mockGetSubscriptionStatus.mockRejectedValue(new Error('DB connection failed'));

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block DELETE requests for expired subscriptions', async () => {
    mockGetSubscriptionStatus.mockResolvedValue({
      status: 'EXPIRED',
      plan: null,
      trialEndsAt: null,
      subscriptionEndsAt: null,
      daysRemaining: 0,

      canUseApp: false,
    });

    const req = createMockReq({ method: 'DELETE' });
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
