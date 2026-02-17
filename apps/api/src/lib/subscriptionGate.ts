/**
 * Subscription Gate Middleware
 * Blocks write operations for clinics with expired subscriptions.
 * Must run AFTER authMiddleware (needs req.clinic.id).
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/index.js';
import { getSubscriptionStatus } from '../services/subscriptionService.js';

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
    const sub = await getSubscriptionStatus(clinicId);

    if (!sub.canUseApp) {
      return res.status(403).json({
        error: {
          code: 'SUBSCRIPTION_EXPIRED',
          message: 'Your subscription has expired. Please upgrade to continue.',
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
