/**
 * Admin Routes
 * Provides business metrics and clinic health data for the admin dashboard
 *
 * Note: For MVP, we use the same auth as clinic login but check for a specific admin email.
 * In production, this should use a separate AdminUser model with proper role-based access.
 */

import { Router, Response } from 'express';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import { getAdminMetrics, getClinicHealthList } from '../services/adminService.js';

const router = Router();

// Admin email(s) - in production, this should come from AdminUser table
const ADMIN_EMAILS = [
  'admin@doctorq.tn',
  'rached@doctorq.tn',
  // Add your email here for testing
];

/**
 * Middleware to check if the authenticated user is an admin
 */
function isAdmin(req: AuthRequest, res: Response, next: () => void) {
  const clinicEmail = req.clinic?.email;

  if (!clinicEmail || !ADMIN_EMAILS.includes(clinicEmail.toLowerCase())) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
  }

  next();
}

/**
 * GET /api/admin/metrics
 * Get business metrics for admin dashboard
 */
router.get('/metrics', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const metrics = await getAdminMetrics();

    res.json({
      data: metrics,
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch admin metrics',
      },
    });
  }
});

/**
 * GET /api/admin/clinics
 * Get clinic health list for admin dashboard
 */
router.get('/clinics', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const clinics = await getClinicHealthList();

    res.json({
      data: clinics,
    });
  } catch (error) {
    console.error('Error fetching clinic health:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch clinic health data',
      },
    });
  }
});

export default router;
