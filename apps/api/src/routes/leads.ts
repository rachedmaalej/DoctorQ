import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';

const router = Router();

const leadSchema = z.object({
  email: z.string().email('Invalid email address'),
  source: z.string().optional(),
});

// POST /api/leads — capture an email from teaser page
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, source } = leadSchema.parse(req.body);

    const lead = await prisma.lead.upsert({
      where: { email },
      update: {},
      create: { email, source: source || 'teaser' },
    });

    logger.info({ email: lead.email, source: lead.source }, 'Lead captured');
    res.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    logger.error({ err }, 'Failed to capture lead');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
