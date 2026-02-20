/**
 * Push Notification Routes
 * Public endpoints for managing Web Push subscriptions on patient status pages.
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { getVapidPublicKey } from '../lib/webpush.js';
import { logger } from '../lib/logger.js';

const router = Router();

/**
 * GET /api/push/vapid-key
 * Returns the VAPID public key so the client can subscribe to push.
 * Public endpoint — no auth required.
 */
router.get('/vapid-key', (_req, res) => {
  const key = getVapidPublicKey();
  if (!key) {
    return res.status(503).json({ error: 'Push notifications not configured' });
  }
  res.json({ vapidPublicKey: key });
});

/**
 * POST /api/push/subscribe
 * Save a push subscription linked to a queue entry.
 * Public endpoint — patients call this from their status page.
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { entryId, endpoint, p256dh, auth } = req.body;

    if (!entryId || !endpoint || !p256dh || !auth) {
      return res.status(400).json({ error: 'Missing required fields: entryId, endpoint, p256dh, auth' });
    }

    // Verify the queue entry exists and is active
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      select: { id: true, status: true },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    // Avoid duplicates — check if this exact endpoint is already saved for this entry
    const existing = await prisma.pushSubscription.findFirst({
      where: { entryId, endpoint },
    });

    if (existing) {
      // Update keys in case they changed
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: { p256dh, auth },
      });
      return res.json({ success: true, updated: true });
    }

    // Create new subscription
    await prisma.pushSubscription.create({
      data: { entryId, endpoint, p256dh, auth },
    });

    logger.info({ entryId }, 'Push subscription saved');
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Failed to save push subscription');
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

export default router;
