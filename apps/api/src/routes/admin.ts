/**
 * Admin Routes
 * SaaS command center: clinic management, metrics, and payment tracking.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, signToken } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import {
  getAdminMetrics,
  getAdminMetricsWithTrends,
  getClinicHealthList,
  getClinicDetails,
  getClinicDetailEnriched,
  createClinic,
  updateClinicStatus,
  resetClinicPassword,
  deleteClinic,
  getClinicForImpersonation,
  recordPayment,
  getClinicPayments,
  updatePaymentStatus,
  getSubscriptionMetrics,
  getOnboardingFunnel,
  getRecentActivity,
  getFinancialAnalytics,
  getFeatureAdoption,
  getPlatformHealth,
  extendTrial,
  upgradeToActive,
  updateClinicInfo,
  getClinicsSummary,
  getFinancialSummary,
  getEngagementSummary,
} from '../services/adminService.js';
import { initPayment, getPaymentDetails } from '../lib/payment/index.js';
import { brand } from '../lib/brand.js';
import { logger } from '../lib/logger.js';

const router = Router();

export const ADMIN_EMAILS = brand.adminEmails;

function isAdmin(req: AuthRequest, res: Response, next: () => void) {
  const clinicEmail = req.clinic?.email;
  if (!clinicEmail || !ADMIN_EMAILS.includes(clinicEmail.toLowerCase())) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    });
  }
  next();
}

// ─── Metrics ─────────────────────────────────────────────────

router.get('/metrics', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const metrics = await getAdminMetrics();
    res.json({ data: metrics });
  } catch (error) {
    logger.error({ err: error }, "Error fetching admin metrics");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch admin metrics' } });
  }
});

// ─── Metrics with Trends ─────────────────────────────────────

router.get('/metrics/trends', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const period = (req.query.period as 'today' | '7d' | '30d' | 'all') || '30d';
    const metrics = await getAdminMetricsWithTrends(period);
    res.json({ data: metrics });
  } catch (error) {
    logger.error({ err: error }, "Error fetching admin metrics with trends");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch admin metrics' } });
  }
});

// ─── Clinic List ─────────────────────────────────────────────

router.get('/clinics', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const clinics = await getClinicHealthList();
    res.json({ data: clinics });
  } catch (error) {
    logger.error({ err: error }, "Error fetching clinic health");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clinic health data' } });
  }
});

// ─── V3: Clinics Summary ────────────────────────────────────

router.get('/clinics/summary', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getClinicsSummary();
    res.json({ data });
  } catch (error) {
    logger.error({ err: error }, "Error fetching clinics summary");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clinics summary' } });
  }
});

// ─── V4: Enriched Clinic Detail ─────────────────────────────

router.get('/clinics/:id/detail', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const detail = await getClinicDetailEnriched(req.params.id);
    res.json({ data: detail });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Clinic not found' } });
    }
    logger.error({ err: error }, "Error fetching enriched clinic detail");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clinic detail' } });
  }
});

// ─── Clinic Detail ───────────────────────────────────────────

router.get('/clinics/:id', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const detail = await getClinicDetails(req.params.id);
    res.json({ data: detail });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Clinic not found' } });
    }
    logger.error({ err: error }, "Error fetching clinic details");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clinic details' } });
  }
});

// ─── Create Clinic ───────────────────────────────────────────

const createClinicSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  doctorName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  language: z.enum(['fr', 'ar']).optional(),
  avgConsultationMins: z.number().min(1).max(120).optional(),
  businessType: z.string().optional(),
  showAppointments: z.boolean().optional(),
});

router.post('/clinics', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = createClinicSchema.parse(req.body);
    const clinic = await createClinic(data);
    res.status(201).json({ data: clinic });
  } catch (error: any) {
    if (error.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: error.message } });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } });
    }
    logger.error({ err: error }, "Error creating clinic");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create clinic' } });
  }
});

// ─── Update Clinic Status ────────────────────────────────────

router.patch('/clinics/:id/status', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body);
    const clinic = await updateClinicStatus(req.params.id, isActive);
    res.json({ data: clinic });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }
    logger.error({ err: error }, "Error updating clinic status");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update clinic status' } });
  }
});

// ─── Update Clinic Info ──────────────────────────────────────

const updateClinicSchema = z.object({
  name: z.string().min(1).optional(),
  doctorName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  language: z.enum(['fr', 'ar']).optional(),
  avgConsultationMins: z.number().min(1).max(120).optional(),
  businessType: z.string().optional(),
  address: z.string().optional(),
  notifyAtPosition: z.number().min(1).max(10).optional(),
  multiDoctorEnabled: z.boolean().optional(),
});

router.patch('/clinics/:id', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateClinicSchema.parse(req.body);
    const clinic = await updateClinicInfo(req.params.id, data);
    res.json({ data: clinic });
  } catch (error: any) {
    if (error.code === 'EMAIL_EXISTS') {
      return res.status(409).json({ error: { code: 'EMAIL_EXISTS', message: error.message } });
    }
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } });
    }
    logger.error({ err: error }, "Error updating clinic info");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update clinic info' } });
  }
});

// ─── Reset Clinic Password ───────────────────────────────────

router.post('/clinics/:id/reset-password', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { password } = z.object({ password: z.string().min(6) }).parse(req.body);
    const clinic = await resetClinicPassword(req.params.id, password);
    res.json({ data: clinic });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }
    logger.error({ err: error }, "Error resetting password");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } });
  }
});

// ─── Delete Clinic ──────────────────────────────────────────

router.delete('/clinics/:id', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const clinic = await deleteClinic(req.params.id);
    res.json({ data: clinic });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Clinic not found' } });
    }
    logger.error({ err: error }, "Error deleting clinic");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete clinic' } });
  }
});

// ─── Impersonate Clinic (Login As) ──────────────────────────

router.post('/clinics/:id/impersonate', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const clinic = await getClinicForImpersonation(req.params.id);

    // Generate a token for this clinic
    const token = signToken({
      clinicId: clinic.id,
      email: clinic.email,
      name: clinic.name,
    });

    // Return token and clinic info
    res.json({
      data: {
        token,
        clinic: {
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          doctorName: clinic.doctorName,
          language: clinic.language,
          avgConsultationMins: clinic.avgConsultationMins,
          notifyAtPosition: clinic.notifyAtPosition,
          isDoctorPresent: clinic.isDoctorPresent,
          businessType: clinic.businessType,
          showAppointments: clinic.showAppointments,
          multiDoctorEnabled: clinic.multiDoctorEnabled,
        },
        isImpersonation: true,
      },
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Clinic not found' } });
    }
    logger.error({ err: error }, "Error impersonating clinic");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to impersonate clinic' } });
  }
});

// ─── Payment: Record Manual ──────────────────────────────────

const recordPaymentSchema = z.object({
  amount: z.number().min(1),
  month: z.string(), // ISO date (first of month)
  method: z.enum(['bank_transfer', 'cash', 'cheque', 'konnect']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/clinics/:id/payments', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = recordPaymentSchema.parse(req.body);
    const payment = await recordPayment(req.params.id, {
      ...data,
      recordedBy: req.clinic?.email || 'admin',
    });
    res.status(201).json({ data: payment });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: error.errors } });
    }
    logger.error({ err: error }, "Error recording payment");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record payment' } });
  }
});

// ─── Payment: History ────────────────────────────────────────

router.get('/clinics/:id/payments', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await getClinicPayments(req.params.id);
    res.json({ data: payments });
  } catch (error) {
    logger.error({ err: error }, "Error fetching payments");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments' } });
  }
});

// ─── V2: Subscription Metrics ────────────────────────────────

router.get('/subscription-metrics', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const metrics = await getSubscriptionMetrics();
    res.json({ data: metrics });
  } catch (error) {
    logger.error({ err: error }, "Error fetching subscription metrics");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch subscription metrics' } });
  }
});

// ─── V2: Onboarding Funnel ──────────────────────────────────

router.get('/onboarding-funnel', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const funnel = await getOnboardingFunnel();
    res.json({ data: funnel });
  } catch (error) {
    logger.error({ err: error }, "Error fetching onboarding funnel");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch onboarding funnel' } });
  }
});

// ─── V2: Activity Feed ──────────────────────────────────────

router.get('/activity-feed', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const activity = await getRecentActivity(limit);
    res.json({ data: activity });
  } catch (error) {
    logger.error({ err: error }, "Error fetching activity feed");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch activity feed' } });
  }
});

// ─── V2: Financial Analytics ────────────────────────────────

router.get('/financial', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const analytics = await getFinancialAnalytics();
    res.json({ data: analytics });
  } catch (error) {
    logger.error({ err: error }, "Error fetching financial analytics");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch financial analytics' } });
  }
});

// ─── V2: Feature Adoption ───────────────────────────────────

router.get('/feature-adoption', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const adoption = await getFeatureAdoption();
    res.json({ data: adoption });
  } catch (error) {
    logger.error({ err: error }, "Error fetching feature adoption");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch feature adoption' } });
  }
});

// ─── V2: Platform Health ────────────────────────────────────

router.get('/platform-health', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const health = await getPlatformHealth();
    res.json({ data: health });
  } catch (error) {
    logger.error({ err: error }, "Error fetching platform health");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch platform health' } });
  }
});

// ─── V2: Extend Trial ───────────────────────────────────────

router.patch('/clinics/:id/trial', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { days } = z.object({ days: z.number().min(1).max(365) }).parse(req.body);
    const result = await extendTrial(req.params.id, days);
    res.json({ data: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Clinic not found' } });
    }
    logger.error({ err: error }, "Error extending trial");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to extend trial' } });
  }
});

// ─── V2: Upgrade Subscription ───────────────────────────────

router.patch('/clinics/:id/upgrade', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = z.object({ plan: z.enum(['MONTHLY', 'YEARLY']) }).parse(req.body);
    const result = await upgradeToActive(req.params.id, plan);
    res.json({ data: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid input' } });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Clinic not found' } });
    }
    logger.error({ err: error }, "Error upgrading subscription");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to upgrade subscription' } });
  }
});

// ─── V3: Financial Summary ──────────────────────────────────

router.get('/financial/summary', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getFinancialSummary();
    res.json({ data });
  } catch (error) {
    logger.error({ err: error }, "Error fetching financial summary");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch financial summary' } });
  }
});

// ─── V3: Engagement Summary ────────────────────────────────

router.get('/engagement/summary', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const data = await getEngagementSummary();
    res.json({ data });
  } catch (error) {
    logger.error({ err: error }, "Error fetching engagement summary");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch engagement summary' } });
  }
});

// ─── Payment: Init Konnect ───────────────────────────────────

router.post('/clinics/:id/payments/konnect', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { month } = z.object({ month: z.string() }).parse(req.body);
    const clinicId = req.params.id;

    const webhookBase = process.env.KONNECT_WEBHOOK_URL || `${req.protocol}://${req.get('host')}`;
    const frontendUrl = process.env.FRONTEND_URL || 'https://web-zeta-five-39.vercel.app';

    const result = await initPayment({
      amount: brand.pricing.monthly,
      orderId: `${clinicId}-${month}`,
      description: `${brand.name} subscription - ${month}`,
      webhookUrl: `${webhookBase}/api/admin/webhooks/konnect`,
      successUrl: `${frontendUrl}/admin?payment=success`,
      failUrl: `${frontendUrl}/admin?payment=failed`,
    });

    // Create pending payment record
    await recordPayment(clinicId, {
      amount: brand.pricing.monthly,
      month,
      method: 'konnect',
      reference: result.paymentRef,
      notes: 'Konnect online payment (pending)',
      recordedBy: req.clinic?.email || 'admin',
    });

    // Update status to pending
    await updatePaymentStatus(
      (await getClinicPayments(clinicId)).find((p) => p.reference === result.paymentRef)?.id || '',
      'pending'
    );

    res.json({ data: { payUrl: result.payUrl, paymentRef: result.paymentRef } });
  } catch (error: any) {
    logger.error({ err: error }, "Error initiating Konnect payment");
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to initiate payment' } });
  }
});

// ─── Webhook: Konnect (public, no auth) ──────────────────────

router.post('/webhooks/konnect', async (req: Request, res: Response) => {
  try {
    const paymentRef = req.query.payment_ref as string || req.body?.payment_ref;
    if (!paymentRef) {
      return res.status(400).json({ error: 'Missing payment_ref' });
    }

    logger.info({ paymentRef }, 'Konnect webhook received');

    const details = await getPaymentDetails(paymentRef);
    const status = details.payment.status === 'completed' ? 'paid' : 'failed';

    // Find and update payment record by reference
    const payment = await prisma.paymentRecord.findFirst({
      where: { reference: paymentRef },
    });

    if (payment) {
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: { status, paidAt: new Date() },
      });
      logger.info({ paymentRef, status }, 'Konnect webhook payment updated');
    } else {
      logger.warn({ paymentRef }, 'Konnect webhook: no payment record found');
    }

    res.json({ received: true });
  } catch (error) {
    logger.error({ err: error }, "[Konnect Webhook] Error");
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Need prisma for webhook handler
import { prisma } from '../lib/prisma.js';

export default router;
