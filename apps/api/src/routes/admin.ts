/**
 * Admin Routes
 * SaaS command center: clinic management, metrics, and payment tracking.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import {
  getAdminMetrics,
  getClinicHealthList,
  getClinicDetails,
  createClinic,
  updateClinicStatus,
  resetClinicPassword,
  recordPayment,
  getClinicPayments,
  updatePaymentStatus,
} from '../services/adminService.js';
import { initPayment, getPaymentDetails } from '../lib/konnect.js';

const router = Router();

const ADMIN_EMAILS = [
  'admin@doctorq.tn',
  'rached@doctorq.tn',
];

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
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch admin metrics' } });
  }
});

// ─── Clinic List ─────────────────────────────────────────────

router.get('/clinics', authMiddleware, isAdmin, async (_req: AuthRequest, res: Response) => {
  try {
    const clinics = await getClinicHealthList();
    res.json({ data: clinics });
  } catch (error) {
    console.error('Error fetching clinic health:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch clinic health data' } });
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
    console.error('Error fetching clinic details:', error);
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
    console.error('Error creating clinic:', error);
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
    console.error('Error updating clinic status:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update clinic status' } });
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
    console.error('Error resetting password:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to reset password' } });
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
    console.error('Error recording payment:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record payment' } });
  }
});

// ─── Payment: History ────────────────────────────────────────

router.get('/clinics/:id/payments', authMiddleware, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await getClinicPayments(req.params.id);
    res.json({ data: payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch payments' } });
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
      amount: 50000, // 50 TND in millimes
      orderId: `${clinicId}-${month}`,
      description: `BléSaf subscription - ${month}`,
      webhookUrl: `${webhookBase}/api/admin/webhooks/konnect`,
      successUrl: `${frontendUrl}/admin?payment=success`,
      failUrl: `${frontendUrl}/admin?payment=failed`,
    });

    // Create pending payment record
    await recordPayment(clinicId, {
      amount: 50000,
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
    console.error('Error initiating Konnect payment:', error);
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

    console.log(`[Konnect Webhook] Received for payment_ref: ${paymentRef}`);

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
      console.log(`[Konnect Webhook] Payment ${paymentRef} updated to ${status}`);
    } else {
      console.warn(`[Konnect Webhook] No payment record found for ref: ${paymentRef}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Konnect Webhook] Error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Need prisma for webhook handler
import { prisma } from '../lib/prisma.js';

export default router;
