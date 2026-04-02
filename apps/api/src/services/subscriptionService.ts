/**
 * Subscription Service
 * Handles subscription lifecycle and payments.
 */

import { prisma } from '../lib/prisma.js';
import { SubscriptionTier } from '@prisma/client';
import { initPayment, getPaymentDetails } from '../lib/payment/index.js';
import { logger } from '../lib/logger.js';
import { brand } from '../lib/brand.js';
import { DAILY_LIMITS, DOCTOR_LIMITS, HISTORY_DAYS } from '../lib/tierGate.js';

// ─── Constants ───────────────────────────────────────────────

export const PRICING = {
  MONTHLY: brand.pricing.monthly,
  YEARLY: brand.pricing.yearly,
};

// ─── Interfaces ──────────────────────────────────────────────

export interface SubscriptionInfo {
  status: string;
  plan: string | null;
  tier: SubscriptionTier;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number | null;
  canUseApp: boolean;
  limits: {
    dailyPatients: number;
    maxDoctors: number;
    historyDays: number;
  };
  usage: {
    dailyPatientCount: number;
  };
}

export interface CheckoutResult {
  payUrl: string;
  paymentRef: string;
}

// ─── Helper Functions ────────────────────────────────────────

function getSubscriptionEndDate(plan: 'MONTHLY' | 'YEARLY'): Date {
  const endDate = new Date();
  if (plan === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  return endDate;
}

function getDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null;
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Subscription Status ─────────────────────────────────────

/**
 * Get subscription status for a clinic
 */
export async function getSubscriptionStatus(clinicId: string): Promise<SubscriptionInfo> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionTier: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      dailyPatientCount: true,
    },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), { code: 'CLINIC_NOT_FOUND' });
  }

  // Determine which end date to use
  const endDate = clinic.subscriptionStatus === 'TRIAL'
    ? clinic.trialEndsAt
    : clinic.subscriptionEndsAt;

  // FREE tier always has access; paid tiers need active subscription
  const canUseApp = clinic.subscriptionTier === 'FREE'
    || ['TRIAL', 'ACTIVE', 'PAST_DUE'].includes(clinic.subscriptionStatus);

  return {
    status: clinic.subscriptionStatus,
    plan: clinic.subscriptionPlan,
    tier: clinic.subscriptionTier,
    trialEndsAt: clinic.trialEndsAt?.toISOString() ?? null,
    subscriptionEndsAt: clinic.subscriptionEndsAt?.toISOString() ?? null,
    daysRemaining: getDaysRemaining(endDate),
    canUseApp,
    limits: {
      dailyPatients: DAILY_LIMITS[clinic.subscriptionTier],
      maxDoctors: DOCTOR_LIMITS[clinic.subscriptionTier],
      historyDays: HISTORY_DAYS[clinic.subscriptionTier],
    },
    usage: {
      dailyPatientCount: clinic.dailyPatientCount,
    },
  };
}

// ─── Subscription Checkout ───────────────────────────────────

/**
 * Get the price for a tier+plan combination.
 * Uses tier-specific pricing if available, falls back to legacy flat pricing.
 */
export function getTierPrice(tier: SubscriptionTier, plan: 'MONTHLY' | 'YEARLY'): number {
  const tierPricing = brand.pricing.tiers;
  if (tierPricing && tier in tierPricing) {
    const tp = tierPricing[tier as keyof typeof tierPricing];
    return plan === 'MONTHLY' ? tp.monthly : tp.yearly;
  }
  // Fallback to legacy flat pricing (BleSaf)
  return plan === 'MONTHLY' ? PRICING.MONTHLY : PRICING.YEARLY;
}

/**
 * Create a checkout session for subscription payment.
 * Supports tier-specific pricing (AuSuivant) and legacy flat pricing (BleSaf).
 */
export async function createSubscriptionCheckout(
  clinicId: string,
  plan: 'MONTHLY' | 'YEARLY',
  baseUrl: string,
  tier?: SubscriptionTier
): Promise<CheckoutResult> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, email: true, doctorName: true, phone: true, subscriptionTier: true },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), { code: 'CLINIC_NOT_FOUND' });
  }

  // Use requested tier, or current tier, defaulting to SOLO_PRO for new subscriptions
  const targetTier = tier || (clinic.subscriptionTier === 'FREE' ? 'SOLO_PRO' as SubscriptionTier : clinic.subscriptionTier);
  const amount = getTierPrice(targetTier, plan);
  const orderId = `sub_${clinicId}_${Date.now()}`;
  const tierLabel = targetTier.replace('_', ' ');
  const description = `${brand.name} ${tierLabel} ${plan === 'MONTHLY' ? 'Monthly' : 'Yearly'} Subscription`;

  // Use recurring billing for Stripe (France), one-time for Konnect (Tunisia)
  const isStripe = brand.payment.provider === 'stripe';

  const result = await initPayment({
    amount,
    orderId,
    description,
    firstName: clinic.doctorName?.split(' ')[0],
    lastName: clinic.doctorName?.split(' ').slice(1).join(' '),
    email: clinic.email,
    phone: clinic.phone ?? undefined,
    webhookUrl: isStripe
      ? `${baseUrl}/api/subscription/webhooks/stripe`
      : `${baseUrl}/api/subscription/webhooks/subscription`,
    successUrl: `${baseUrl}/subscription/success?ref=${orderId}`,
    failUrl: `${baseUrl}/subscription/failed?ref=${orderId}`,
    ...(isStripe && {
      recurring: {
        interval: plan === 'MONTHLY' ? 'month' as const : 'year' as const,
      },
    }),
  });

  // Store pending payment info (include tier in notes)
  await prisma.subscriptionEvent.create({
    data: {
      clinicId,
      eventType: 'payment_initiated',
      amount,
      paymentRef: result.paymentRef,
      notes: JSON.stringify({ plan, tier: targetTier, orderId }),
    },
  });

  return {
    payUrl: result.payUrl,
    paymentRef: result.paymentRef,
  };
}

/**
 * Process subscription payment webhook
 */
export async function processSubscriptionPayment(paymentRef: string): Promise<void> {
  // Get payment details from payment gateway
  const paymentDetails = await getPaymentDetails(paymentRef);

  if (paymentDetails.payment.status !== 'completed') {
    logger.info({ paymentRef, status: paymentDetails.payment.status }, 'Subscription payment not completed');
    return;
  }

  // Find the subscription event with this payment ref
  const event = await prisma.subscriptionEvent.findFirst({
    where: { paymentRef },
    orderBy: { createdAt: 'desc' },
  });

  if (!event || !event.notes) {
    logger.error({ paymentRef }, 'No subscription event found for payment');
    return;
  }

  const { plan, tier } = JSON.parse(event.notes) as { plan: 'MONTHLY' | 'YEARLY'; tier?: SubscriptionTier };
  const subscriptionEndsAt = getSubscriptionEndDate(plan);
  const activatedTier = tier || ('SOLO_PRO' as SubscriptionTier);

  // Update clinic subscription + tier
  await prisma.clinic.update({
    where: { id: event.clinicId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: plan,
      subscriptionTier: activatedTier,
      subscriptionEndsAt,
    },
  });

  // Log success event
  await prisma.subscriptionEvent.create({
    data: {
      clinicId: event.clinicId,
      eventType: 'payment_success',
      amount: paymentDetails.payment.amount,
      paymentRef,
      notes: `${activatedTier} ${plan} subscription activated until ${subscriptionEndsAt.toISOString()}`,
    },
  });

  logger.info({ clinicId: event.clinicId, plan, tier: activatedTier }, 'Subscription activated');
}

// ─── Subscription Expiry Check ───────────────────────────────

/**
 * Check and update expired subscriptions
 * Should be run as a scheduled task
 */
export async function checkExpiredSubscriptions(): Promise<void> {
  const now = new Date();

  // Find expired trials
  const expiredTrials = await prisma.clinic.findMany({
    where: {
      subscriptionStatus: 'TRIAL',
      trialEndsAt: { lt: now },
      country: brand.country,
    },
    select: { id: true },
  });

  if (expiredTrials.length > 0) {
    await prisma.clinic.updateMany({
      where: { id: { in: expiredTrials.map((c) => c.id) } },
      data: { subscriptionStatus: 'EXPIRED' },
    });

    // Log events
    await prisma.subscriptionEvent.createMany({
      data: expiredTrials.map((c) => ({
        clinicId: c.id,
        eventType: 'trial_expired',
        notes: 'Trial period ended',
      })),
    });

    logger.info({ count: expiredTrials.length }, 'Expired trial subscriptions');
  }

  // Find expired paid subscriptions
  const expiredPaid = await prisma.clinic.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptionEndsAt: { lt: now },
      country: brand.country,
    },
    select: { id: true },
  });

  if (expiredPaid.length > 0) {
    await prisma.clinic.updateMany({
      where: { id: { in: expiredPaid.map((c) => c.id) } },
      data: { subscriptionStatus: 'EXPIRED' },
    });

    // Log events
    await prisma.subscriptionEvent.createMany({
      data: expiredPaid.map((c) => ({
        clinicId: c.id,
        eventType: 'subscription_expired',
        notes: 'Paid subscription ended',
      })),
    });

    logger.info({ count: expiredPaid.length }, 'Expired paid subscriptions');
  }
}

// ─── Payment History ─────────────────────────────────────────

/**
 * Get subscription payment history
 */
export async function getPaymentHistory(clinicId: string): Promise<Array<{
  id: string;
  eventType: string;
  amount: number | null;
  createdAt: string;
  notes: string | null;
}>> {
  const events = await prisma.subscriptionEvent.findMany({
    where: {
      clinicId,
      eventType: { in: ['payment_success', 'trial_started', 'subscription_expired'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    amount: e.amount,
    createdAt: e.createdAt.toISOString(),
    notes: e.notes,
  }));
}
