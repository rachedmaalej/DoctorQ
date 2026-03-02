/**
 * Patient Routes
 * Autocomplete search for returning patients
 */

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import { logger } from '../lib/logger.js';

const router = Router();

// GET /api/patients/search?q=<query> — autocomplete for patient name
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { q } = req.query;

    if (!q || String(q).length < 2) {
      return res.json({ data: [] });
    }

    const patients = await prisma.patient.findMany({
      where: {
        clinicId,
        deletedAt: null,
        name: {
          contains: String(q),
          mode: 'insensitive',
        },
      },
      orderBy: { lastVisitAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        phone: true,
        visitCount: true,
        lastVisitAt: true,
      },
    });

    res.json({ data: patients });
  } catch (error) {
    logger.error({ err: error }, 'Patient search error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to search patients' },
    });
  }
});

export default router;
