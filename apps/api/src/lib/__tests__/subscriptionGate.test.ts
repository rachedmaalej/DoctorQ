import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionGate } from '../subscriptionGate.js';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../types/index.js';

// Mock Prisma
vi.mock('../prisma.js', () => ({
  prisma: {
    clinic: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '../prisma.js';

const mockFindUnique = vi.mocked(prisma.clinic.findUnique);

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
    expect(mockFindUnique).not.toHaveBeenCalled();
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
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: 'SOLO_PRO',
    } as any);

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should allow POST requests when subscription is TRIAL', async () => {
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'TRIAL',
      subscriptionTier: 'SOLO_PRO',
    } as any);

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should always allow FREE tier through regardless of subscription status', async () => {
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'EXPIRED',
      subscriptionTier: 'FREE',
    } as any);

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block POST requests when paid tier subscription is EXPIRED', async () => {
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'EXPIRED',
      subscriptionTier: 'SOLO_PRO',
    } as any);

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: {
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your subscription has expired. Please upgrade to continue.',
        currentTier: 'SOLO_PRO',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail-open if prisma throws an error', async () => {
    mockFindUnique.mockRejectedValue(new Error('DB connection failed'));

    const req = createMockReq();
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should block DELETE requests for expired paid subscriptions', async () => {
    mockFindUnique.mockResolvedValue({
      subscriptionStatus: 'EXPIRED',
      subscriptionTier: 'EQUIPE',
    } as any);

    const req = createMockReq({ method: 'DELETE' });
    const res = createMockRes();

    await subscriptionGate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
