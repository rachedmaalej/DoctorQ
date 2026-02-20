/**
 * Client-side Web Push subscription management.
 * Handles service worker registration, permission prompts, and subscription lifecycle.
 */

import { api } from './api';
import { logger } from './logger';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/** Convert a base64url VAPID key to a Uint8Array for PushManager.subscribe() */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Check if push notifications are supported in this browser context */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  );
}

/** Check if we're running as an installed PWA (standalone mode) */
export function isStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

/** Check if this is iOS Safari (where PWA install is required for push) */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/** Get current notification permission state */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Register the service worker and subscribe to push notifications.
 * Returns the subscription if successful, null otherwise.
 */
export async function subscribeToPush(entryId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    logger.log('[Push] Not supported in this browser');
    return null;
  }

  try {
    // 1. Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    logger.log('[Push] Service worker registered');

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      logger.log('[Push] Permission denied:', permission);
      return null;
    }

    // 3. Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 4. Create new push subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      logger.log('[Push] New subscription created');
    } else {
      logger.log('[Push] Using existing subscription');
    }

    // 5. Send subscription to server, linked to this queue entry
    await api.savePushSubscription(entryId, subscription);
    logger.log('[Push] Subscription saved to server for entry:', entryId);

    return subscription;
  } catch (error) {
    logger.error('[Push] Subscription failed:', error);
    return null;
  }
}

/**
 * Check if we already have an active push subscription
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
