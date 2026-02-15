/**
 * Subscription Routes
 * Authenticated endpoints for subscription management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { brand } from '../lib/brand.js';
import { AuthRequest } from '../types/index.js';
import {
  getSubscriptionStatus,
  createSubscriptionCheckout,
  getPaymentHistory,
  processSubscriptionPayment,
  PRICING,
} from '../services/subscriptionService.js';
import {
  updateOnboardingStep,
  getOnboardingStatus,
} from '../services/signupService.js';
import { logger } from '../lib/logger.js';
import { sendFirstMorningEmail } from '../lib/email.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const checkoutSchema = z.object({
  plan: z.enum(['MONTHLY', 'YEARLY']),
});

const onboardingStepSchema = z.object({
  step: z.number().min(0).max(3),
  completed: z.boolean().optional(),
});

// ─── Public Routes (Webhooks) ────────────────────────────────

/**
 * POST /api/subscription/webhooks/subscription
 * Konnect webhook for subscription payments
 */
router.post('/webhooks/subscription', async (req: Request, res: Response) => {
  try {
    const { payment_ref } = req.body;

    if (!payment_ref) {
      return res.status(400).json({ error: 'Missing payment_ref' });
    }

    await processSubscriptionPayment(payment_ref);

    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Subscription webhook error");
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ─── Public Routes (Pricing) ─────────────────────────────────

/**
 * GET /api/subscription/pricing
 * Get current pricing information
 */
router.get('/pricing', (req: Request, res: Response) => {
  res.json({
    data: {
      subscription: {
        monthly: {
          amount: PRICING.MONTHLY,
          amountDisplay: PRICING.MONTHLY / brand.currency.multiplier,
          currency: brand.currency.symbol,
          description: 'Monthly subscription',
        },
        yearly: {
          amount: PRICING.YEARLY,
          amountDisplay: PRICING.YEARLY / brand.currency.multiplier,
          currency: brand.currency.symbol,
          description: 'Yearly subscription (2 months free)',
          savings: (PRICING.MONTHLY * 12 - PRICING.YEARLY) / brand.currency.multiplier,
        },
      },
      trialDays: brand.pricing.freeTrialDays,
    },
  });
});

// ─── Authenticated Routes ────────────────────────────────────

/**
 * GET /api/subscription
 * Get current subscription status
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const status = await getSubscriptionStatus(req.clinic!.id);

    res.json({ data: status });
  } catch (error) {
    logger.error({ err: error }, "Get subscription error");
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get subscription status',
      },
    });
  }
});

/**
 * POST /api/subscription/checkout
 * Create checkout session for subscription
 */
router.post('/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = checkoutSchema.parse(req.body);

    // Get base URL from request or env
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

    const result = await createSubscriptionCheckout(req.clinic!.id, plan, baseUrl);

    res.json({
      data: {
        payUrl: result.payUrl,
        paymentRef: result.paymentRef,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    logger.error({ err: error }, "Checkout error");
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create checkout session',
      },
    });
  }
});

/**
 * GET /api/subscription/history
 * Get payment history
 */
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const history = await getPaymentHistory(req.clinic!.id);

    res.json({ data: history });
  } catch (error) {
    logger.error({ err: error }, "Get payment history error");
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get payment history',
      },
    });
  }
});

// ─── Onboarding Routes ───────────────────────────────────────

/**
 * GET /api/subscription/onboarding
 * Get onboarding status
 */
router.get('/onboarding', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const status = await getOnboardingStatus(req.clinic!.id);

    res.json({ data: status });
  } catch (error) {
    logger.error({ err: error }, "Get onboarding status error");
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get onboarding status',
      },
    });
  }
});

/**
 * POST /api/subscription/onboarding
 * Update onboarding progress
 */
router.post('/onboarding', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { step, completed } = onboardingStepSchema.parse(req.body);

    await updateOnboardingStep(req.clinic!.id, step, completed);

    // Send "first morning" email when onboarding is completed
    if (completed) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: req.clinic!.id },
        select: { email: true, doctorName: true, language: true },
      });
      if (clinic?.email) {
        sendFirstMorningEmail(
          clinic.email,
          clinic.doctorName || 'Docteur',
          (clinic.language as 'fr' | 'ar') || 'fr'
        ).catch(err => logger.error({ err }, 'Failed to send first morning email'));
      }
    }

    res.json({
      data: {
        message: 'Onboarding progress updated',
        step,
        completed: completed ?? false,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
        },
      });
    }

    logger.error({ err: error }, "Update onboarding error");
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update onboarding progress',
      },
    });
  }
});

export default router;
