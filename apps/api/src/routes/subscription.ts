/**
 * Subscription Routes
 * Authenticated endpoints for subscription management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import {
  getSubscriptionStatus,
  createSubscriptionCheckout,
  createSmsPackageCheckout,
  getSmsBalance,
  getPaymentHistory,
  processSubscriptionPayment,
  processSmsPackagePayment,
  PRICING,
  SMS_PACKAGES,
} from '../services/subscriptionService.js';
import {
  updateOnboardingStep,
  getOnboardingStatus,
} from '../services/signupService.js';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const checkoutSchema = z.object({
  plan: z.enum(['MONTHLY', 'YEARLY']),
});

const smsPackageSchema = z.object({
  package: z.enum(['starter', 'standard', 'pro']),
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
    console.error('Subscription webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/subscription/webhooks/sms-package
 * Konnect webhook for SMS package payments
 */
router.post('/webhooks/sms-package', async (req: Request, res: Response) => {
  try {
    const { payment_ref } = req.body;

    if (!payment_ref) {
      return res.status(400).json({ error: 'Missing payment_ref' });
    }

    await processSmsPackagePayment(payment_ref);

    res.json({ success: true });
  } catch (error) {
    console.error('SMS package webhook error:', error);
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
          amountTND: PRICING.MONTHLY / 1000,
          description: 'Monthly subscription',
        },
        yearly: {
          amount: PRICING.YEARLY,
          amountTND: PRICING.YEARLY / 1000,
          description: 'Yearly subscription (2 months free)',
          savings: (PRICING.MONTHLY * 12 - PRICING.YEARLY) / 1000,
        },
      },
      smsPackages: {
        starter: {
          ...SMS_PACKAGES.starter,
          amountTND: SMS_PACKAGES.starter.amount / 1000,
          perSms: SMS_PACKAGES.starter.amount / SMS_PACKAGES.starter.credits / 1000,
        },
        standard: {
          ...SMS_PACKAGES.standard,
          amountTND: SMS_PACKAGES.standard.amount / 1000,
          perSms: SMS_PACKAGES.standard.amount / SMS_PACKAGES.standard.credits / 1000,
        },
        pro: {
          ...SMS_PACKAGES.pro,
          amountTND: SMS_PACKAGES.pro.amount / 1000,
          perSms: SMS_PACKAGES.pro.amount / SMS_PACKAGES.pro.credits / 1000,
        },
      },
      trialDays: 30,
      freeSmsTrial: 50,
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
    console.error('Get subscription error:', error);
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

    console.error('Checkout error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to create checkout session',
      },
    });
  }
});

/**
 * GET /api/subscription/sms
 * Get SMS credit balance
 */
router.get('/sms', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const balance = await getSmsBalance(req.clinic!.id);

    res.json({ data: balance });
  } catch (error) {
    console.error('Get SMS balance error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get SMS balance',
      },
    });
  }
});

/**
 * POST /api/subscription/sms/checkout
 * Create checkout session for SMS package
 */
router.post('/sms/checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { package: packageName } = smsPackageSchema.parse(req.body);

    // Get base URL from request or env
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;

    const result = await createSmsPackageCheckout(req.clinic!.id, packageName, baseUrl);

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

    console.error('SMS checkout error:', error);
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
    console.error('Get payment history error:', error);
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
    console.error('Get onboarding status error:', error);
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

    console.error('Update onboarding error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update onboarding progress',
      },
    });
  }
});

export default router;
