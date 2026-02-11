/**
 * Subscription Service
 * Handles subscription lifecycle, payments, and SMS package purchases.
 */

import { prisma } from '../lib/prisma.js';
import { initPayment, getPaymentDetails } from '../lib/konnect.js';
import { logger } from '../lib/logger.js';

// ─── Constants ───────────────────────────────────────────────

// Pricing in millimes (1 TND = 1000 millimes)
export const PRICING = {
  MONTHLY: 50000, // 50 TND
  YEARLY: 500000, // 500 TND (2 months free)
  SMS_STARTER: 10000, // 10 TND for 100 SMS
  SMS_STANDARD: 25000, // 25 TND for 300 SMS
  SMS_PRO: 70000, // 70 TND for 1000 SMS
};

export const SMS_PACKAGES = {
  starter: { credits: 100, amount: PRICING.SMS_STARTER, name: 'Starter' },
  standard: { credits: 300, amount: PRICING.SMS_STANDARD, name: 'Standard' },
  pro: { credits: 1000, amount: PRICING.SMS_PRO, name: 'Pro' },
};

// ─── Interfaces ──────────────────────────────────────────────

export interface SubscriptionInfo {
  status: string;
  plan: string | null;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  daysRemaining: number | null;
  smsCredits: number;
  canUseApp: boolean;
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
      trialEndsAt: true,
      subscriptionEndsAt: true,
      smsCredits: true,
    },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), { code: 'CLINIC_NOT_FOUND' });
  }

  // Determine which end date to use
  const endDate = clinic.subscriptionStatus === 'TRIAL'
    ? clinic.trialEndsAt
    : clinic.subscriptionEndsAt;

  // Can use app if trial is active OR subscription is active/past_due
  const canUseApp = ['TRIAL', 'ACTIVE', 'PAST_DUE'].includes(clinic.subscriptionStatus);

  return {
    status: clinic.subscriptionStatus,
    plan: clinic.subscriptionPlan,
    trialEndsAt: clinic.trialEndsAt?.toISOString() ?? null,
    subscriptionEndsAt: clinic.subscriptionEndsAt?.toISOString() ?? null,
    daysRemaining: getDaysRemaining(endDate),
    smsCredits: clinic.smsCredits,
    canUseApp,
  };
}

// ─── Subscription Checkout ───────────────────────────────────

/**
 * Create a checkout session for subscription payment
 */
export async function createSubscriptionCheckout(
  clinicId: string,
  plan: 'MONTHLY' | 'YEARLY',
  baseUrl: string
): Promise<CheckoutResult> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, name: true, email: true, doctorName: true, phone: true },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), { code: 'CLINIC_NOT_FOUND' });
  }

  const amount = plan === 'MONTHLY' ? PRICING.MONTHLY : PRICING.YEARLY;
  const orderId = `sub_${clinicId}_${Date.now()}`;
  const description = `BleSaf ${plan === 'MONTHLY' ? 'Monthly' : 'Yearly'} Subscription`;

  const result = await initPayment({
    amount,
    orderId,
    description,
    firstName: clinic.doctorName?.split(' ')[0],
    lastName: clinic.doctorName?.split(' ').slice(1).join(' '),
    email: clinic.email,
    phone: clinic.phone ?? undefined,
    webhookUrl: `${baseUrl}/api/webhooks/subscription`,
    successUrl: `${baseUrl}/subscription/success?ref=${orderId}`,
    failUrl: `${baseUrl}/subscription/failed?ref=${orderId}`,
  });

  // Store pending payment info
  await prisma.subscriptionEvent.create({
    data: {
      clinicId,
      eventType: 'payment_initiated',
      amount,
      paymentRef: result.paymentRef,
      notes: JSON.stringify({ plan, orderId }),
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
  // Get payment details from Konnect
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

  const { plan } = JSON.parse(event.notes) as { plan: 'MONTHLY' | 'YEARLY' };
  const subscriptionEndsAt = getSubscriptionEndDate(plan);

  // Update clinic subscription
  await prisma.clinic.update({
    where: { id: event.clinicId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: plan,
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
      notes: `${plan} subscription activated until ${subscriptionEndsAt.toISOString()}`,
    },
  });

  logger.info({ clinicId: event.clinicId, plan }, 'Subscription activated');
}

// ─── SMS Package Purchase ────────────────────────────────────

/**
 * Create checkout for SMS package
 */
export async function createSmsPackageCheckout(
  clinicId: string,
  packageName: keyof typeof SMS_PACKAGES,
  baseUrl: string
): Promise<CheckoutResult> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, email: true, doctorName: true, phone: true },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), { code: 'CLINIC_NOT_FOUND' });
  }

  const pkg = SMS_PACKAGES[packageName];
  if (!pkg) {
    throw Object.assign(new Error('Invalid package'), { code: 'INVALID_PACKAGE' });
  }

  const orderId = `sms_${clinicId}_${packageName}_${Date.now()}`;
  const description = `BleSaf SMS Package - ${pkg.name} (${pkg.credits} SMS)`;

  const result = await initPayment({
    amount: pkg.amount,
    orderId,
    description,
    firstName: clinic.doctorName?.split(' ')[0],
    lastName: clinic.doctorName?.split(' ').slice(1).join(' '),
    email: clinic.email,
    phone: clinic.phone ?? undefined,
    webhookUrl: `${baseUrl}/api/webhooks/sms-package`,
    successUrl: `${baseUrl}/subscription/sms-success?ref=${orderId}`,
    failUrl: `${baseUrl}/subscription/sms-failed?ref=${orderId}`,
  });

  // Store pending purchase
  await prisma.smsPackagePurchase.create({
    data: {
      clinicId,
      packageName,
      credits: pkg.credits,
      amount: pkg.amount,
      paymentRef: result.paymentRef,
      status: 'pending',
    },
  });

  return {
    payUrl: result.payUrl,
    paymentRef: result.paymentRef,
  };
}

/**
 * Process SMS package payment webhook
 */
export async function processSmsPackagePayment(paymentRef: string): Promise<void> {
  // Get payment details from Konnect
  const paymentDetails = await getPaymentDetails(paymentRef);

  if (paymentDetails.payment.status !== 'completed') {
    logger.info({ paymentRef, status: paymentDetails.payment.status }, 'SMS payment not completed');
    return;
  }

  // Find the pending purchase
  const purchase = await prisma.smsPackagePurchase.findFirst({
    where: { paymentRef, status: 'pending' },
  });

  if (!purchase) {
    logger.error({ paymentRef }, 'No pending SMS purchase found for payment');
    return;
  }

  // Update purchase status and add credits
  await prisma.$transaction([
    prisma.smsPackagePurchase.update({
      where: { id: purchase.id },
      data: { status: 'completed' },
    }),
    prisma.clinic.update({
      where: { id: purchase.clinicId },
      data: {
        smsCredits: { increment: purchase.credits },
      },
    }),
  ]);

  logger.info({ clinicId: purchase.clinicId, credits: purchase.credits }, 'SMS credits added');
}

// ─── SMS Credit Management ───────────────────────────────────

/**
 * Deduct SMS credit (called when sending SMS)
 * Returns true if credit was deducted, false if insufficient credits
 */
export async function deductSmsCredit(clinicId: string): Promise<boolean> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { smsCredits: true },
  });

  if (!clinic || clinic.smsCredits <= 0) {
    return false;
  }

  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      smsCredits: { decrement: 1 },
      smsCreditsUsed: { increment: 1 },
    },
  });

  return true;
}

/**
 * Get SMS credit balance
 */
export async function getSmsBalance(clinicId: string): Promise<{ credits: number; used: number }> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { smsCredits: true, smsCreditsUsed: true },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), { code: 'CLINIC_NOT_FOUND' });
  }

  return {
    credits: clinic.smsCredits,
    used: clinic.smsCreditsUsed,
  };
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
