/**
 * Subscription Gate Middleware
 * Blocks write operations for clinics with expired subscriptions.
 * Must run AFTER authMiddleware (needs req.clinic.id).
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from './prisma.js';

export async function subscriptionGate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Allow GET requests through (view-only for expired clinics)
  if (req.method === 'GET') {
    return next();
  }

  const clinicId = req.clinic?.id;
  if (!clinicId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { subscriptionStatus: true, subscriptionTier: true },
    });

    if (!clinic) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      });
    }

    // FREE tier always has access (forever-free)
    if (clinic.subscriptionTier === 'FREE') {
      return next();
    }

    // Paid tiers need active subscription
    const canUseApp = ['TRIAL', 'ACTIVE', 'PAST_DUE'].includes(clinic.subscriptionStatus);
    if (!canUseApp) {
      return res.status(403).json({
        error: {
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your subscription has expired. Please upgrade to continue.',
          currentTier: clinic.subscriptionTier,
        },
      });
    }

    next();
  } catch {
    // If we can't check status, let the request through
    // (fail-open to avoid blocking legitimate users)
    next();
  }
}
