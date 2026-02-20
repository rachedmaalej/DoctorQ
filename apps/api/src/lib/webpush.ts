/**
 * Web Push Notification Service
 * Sends push notifications to subscribed patients via the Web Push protocol.
 * Uses VAPID for authentication with FCM (Android), APNs (iOS), and Mozilla push services.
 */

import webpush from 'web-push';
import { prisma } from './prisma.js';
import { logger } from './logger.js';

// Configure VAPID keys from environment
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@blesaf.tn';

let pushConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  pushConfigured = true;
  logger.info('Web Push configured with VAPID keys');
} else {
  logger.warn('Web Push NOT configured — VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY not set');
}

export function isPushConfigured(): boolean {
  return pushConfigured;
}

export function getVapidPublicKey(): string | undefined {
  return VAPID_PUBLIC_KEY;
}

interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

/**
 * Send a push notification to all subscriptions for a given queue entry.
 * Automatically cleans up invalid/expired subscriptions.
 */
export async function sendPushToEntry(entryId: string, payload: PushPayload): Promise<number> {
  if (!pushConfigured) return 0;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { entryId },
  });

  if (subscriptions.length === 0) return 0;

  const jsonPayload = JSON.stringify(payload);
  let sent = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        jsonPayload,
        { TTL: 300 } // 5 minutes — queue notifications are time-sensitive
      );
      sent++;
    } catch (error: any) {
      // 410 Gone or 404 = subscription expired/invalid — clean up
      if (error.statusCode === 410 || error.statusCode === 404) {
        logger.debug({ subId: sub.id }, 'Removing expired push subscription');
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        logger.error({ err: error, subId: sub.id }, 'Push notification failed');
      }
    }
  }

  logger.debug({ entryId, sent, total: subscriptions.length }, 'Push notifications sent');
  return sent;
}
