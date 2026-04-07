/**
 * Clinic Closures Routes
 * CRUD endpoints for managing exceptional closures (jours fériés, congés, etc.)
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { subscriptionGate } from '../lib/subscriptionGate.js';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const router = Router();

// GET /api/clinic/closures - List all closures for this clinic
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) return res.status(401).json({ error: 'Unauthorized' });

    const closures = await prisma.clinicClosure.findMany({
      where: { clinicId },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, reason: true },
    });

    res.json({ data: closures });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching closures');
    res.status(500).json({ error: 'Failed to fetch closures' });
  }
});

// GET /api/clinic/closures/today - Check if today is a closure day (public-friendly)
router.get('/today', async (req, res: Response) => {
  try {
    const { clinicId } = req.query;
    if (!clinicId || typeof clinicId !== 'string') {
      return res.status(400).json({ error: 'clinicId query parameter required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const closure = await prisma.clinicClosure.findFirst({
      where: {
        clinicId,
        date: { gte: today, lt: tomorrow },
      },
      select: { reason: true },
    });

    res.json({ data: { isClosed: !!closure, reason: closure?.reason ?? null } });
  } catch (error) {
    logger.error({ err: error }, 'Error checking closure');
    res.status(500).json({ error: 'Failed to check closure' });
  }
});

// POST /api/clinic/closures - Add a closure
const addClosureSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD'),
  reason: z.string().max(200).optional(),
});

router.post('/', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) return res.status(401).json({ error: 'Unauthorized' });

    const { date, reason } = addClosureSchema.parse(req.body);

    const closure = await prisma.clinicClosure.create({
      data: {
        clinicId,
        date: new Date(date),
        reason: reason || null,
      },
      select: { id: true, date: true, reason: true },
    });

    res.status(201).json({ data: closure });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: { code: 'CLOSURE_EXISTS', message: 'Cette date est déjà marquée comme fermée' } });
    }
    if (error?.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    logger.error({ err: error }, 'Error adding closure');
    res.status(500).json({ error: 'Failed to add closure' });
  }
});

// DELETE /api/clinic/closures/:id - Remove a closure
router.delete('/:id', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Verify ownership
    const closure = await prisma.clinicClosure.findFirst({
      where: { id, clinicId },
    });

    if (!closure) {
      return res.status(404).json({ error: 'Closure not found' });
    }

    await prisma.clinicClosure.delete({ where: { id } });
    res.json({ data: { success: true } });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting closure');
    res.status(500).json({ error: 'Failed to delete closure' });
  }
});

export default router;
