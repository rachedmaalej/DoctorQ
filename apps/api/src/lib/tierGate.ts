/**
 * Tier Gate Middleware
 * Enforces subscription tier limits on API routes.
 * Must run AFTER authMiddleware (needs req.clinic.id).
 */

import { Response, NextFunction } from 'express';
import { SubscriptionTier } from '@prisma/client';
import { AuthRequest } from '../types/index.js';
import { prisma } from './prisma.js';

// ─── Tier Configuration ─────────────────────────────────────

const TIER_RANK: Record<SubscriptionTier, number> = {
  FREE: 0,
  SOLO_PRO: 1,
  EQUIPE: 2,
  CLINIQUE: 3,
};

export const DAILY_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 30,
  SOLO_PRO: 100,
  EQUIPE: 100,
  CLINIQUE: Infinity,
};

export const DOCTOR_LIMITS: Record<SubscriptionTier, number> = {
  FREE: 1,
  SOLO_PRO: 1,
  EQUIPE: 5,
  CLINIQUE: Infinity,
};

export const HISTORY_DAYS: Record<SubscriptionTier, number> = {
  FREE: 7,
  SOLO_PRO: 90,
  EQUIPE: 90,
  CLINIQUE: Infinity,
};

// ─── Middleware: Require Minimum Tier ────────────────────────

/**
 * Block requests from clinics below the required tier.
 * Returns 403 with upgrade_required error.
 */
export function requireTier(minTier: SubscriptionTier) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { subscriptionTier: true },
    });

    if (!clinic) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      });
    }

    if (TIER_RANK[clinic.subscriptionTier] < TIER_RANK[minTier]) {
      return res.status(403).json({
        error: {
          code: 'UPGRADE_REQUIRED',
          message: `This feature requires the ${minTier} tier or higher`,
          requiredTier: minTier,
          currentTier: clinic.subscriptionTier,
        },
      });
    }

    next();
  };
}

// ─── Middleware: Check Daily Patient Limit ───────────────────

/**
 * Check if the clinic has reached its daily patient limit.
 * Resets the counter if the day has changed.
 * Returns 429 with daily_limit_reached error.
 */
export async function checkDailyLimit(req: AuthRequest, res: Response, next: NextFunction) {
  const clinicId = req.clinic?.id;
  if (!clinicId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      subscriptionTier: true,
      dailyPatientCount: true,
      dailyCountResetAt: true,
    },
  });

  if (!clinic) {
    return res.status(404).json({
      error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
    });
  }

  const limit = DAILY_LIMITS[clinic.subscriptionTier];

  // Reset counter if new day (compare dates in UTC)
  const now = new Date();
  const lastReset = new Date(clinic.dailyCountResetAt);
  const isNewDay =
    now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
    now.getUTCMonth() !== lastReset.getUTCMonth() ||
    now.getUTCDate() !== lastReset.getUTCDate();

  if (isNewDay) {
    await prisma.clinic.update({
      where: { id: clinicId },
      data: { dailyPatientCount: 0, dailyCountResetAt: now },
    });
    // Counter is 0 after reset, so we're under limit
    return next();
  }

  if (clinic.dailyPatientCount >= limit) {
    return res.status(429).json({
      error: {
        code: 'DAILY_LIMIT_REACHED',
        message: `Daily patient limit reached (${limit} patients)`,
        limit,
        current: clinic.dailyPatientCount,
        currentTier: clinic.subscriptionTier,
      },
    });
  }

  next();
}

// ─── Middleware: Check Doctor Limit ──────────────────────────

/**
 * Check if the clinic can add more doctors based on their tier.
 * Returns 403 with doctor_limit_reached error.
 */
export async function checkDoctorLimit(req: AuthRequest, res: Response, next: NextFunction) {
  const clinicId = req.clinic?.id;
  if (!clinicId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { subscriptionTier: true },
  });

  if (!clinic) {
    return res.status(404).json({
      error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
    });
  }

  const limit = DOCTOR_LIMITS[clinic.subscriptionTier];

  // Count active doctors
  const doctorCount = await prisma.doctor.count({
    where: { clinicId, isActive: true },
  });

  if (doctorCount >= limit) {
    return res.status(403).json({
      error: {
        code: 'DOCTOR_LIMIT_REACHED',
        message: `Your ${clinic.subscriptionTier} plan allows up to ${limit} doctor(s)`,
        limit,
        current: doctorCount,
        currentTier: clinic.subscriptionTier,
      },
    });
  }

  next();
}
