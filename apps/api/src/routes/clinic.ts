// Clinic routes - includes doctor presence endpoint
// Last updated: 2026-01-14 - force rebuild
import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import { subscriptionGate } from '../lib/subscriptionGate.js';
import { AuthRequest } from '../types/index.js';
import { emitToRoom } from '../lib/socket.js';
import { logger } from '../lib/logger.js';
import { recalculatePositionsAndStatuses } from '../services/positionService.js';
import { emitQueueUpdate, emitAllPatientUpdates } from '../services/notificationService.js';
import { invalidateStatsCache } from '../services/statsService.js';

const router = Router();

// GET /api/clinic - Get clinic details
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        doctorName: true,
        phone: true,
        address: true,
        language: true,
        avgConsultationMins: true,
        notifyAtPosition: true,
        enableWhatsApp: true,
        isDoctorPresent: true,
        email: true,
        isActive: true,
        enableLanguageSwitcher: true,
        specialty: true,
        funFactsEnabled: true,
        queueMode: true,
        rdvGraceMinutes: true,
        enableStepOut: true,
        siret: true,
        tvaIntracomNumber: true,
        tvaRegime: true,
        postalCode: true,
        city: true,
        presetMessage1: true,
        presetMessage2: true,
        presetMessage3: true,
        presetMessage4: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json({ data: clinic });
  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching clinic');
    res.status(500).json({ error: 'Failed to fetch clinic details' });
  }
});

// PATCH /api/clinic - Update clinic settings
const updateClinicSchema = z.object({
  name: z.string().optional(),
  doctorName: z.string().optional(),
  doctorGender: z.enum(['M', 'F']).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  language: z.enum(['fr', 'ar']).optional(),
  notifyAtPosition: z.number().int().min(1).max(10).optional(),
  enableWhatsApp: z.boolean().optional(),
  specialty: z.string().max(50).optional(),
  funFactsEnabled: z.boolean().optional(),
  enableLanguageSwitcher: z.boolean().optional(),
  queueMode: z.enum(['RDV_PRIORITY', 'FIFO', 'RDV_ON_TIME']).optional(),
  rdvGraceMinutes: z.number().int().min(5).max(30).optional(),
  enableStepOut: z.boolean().optional(),
  googlePlaceId: z.string().max(200).optional().nullable(),
  feedbackEnabled: z.boolean().optional(),
  // France legal identifiers
  siret: z.string().regex(/^\d{14}$/, 'SIRET doit contenir 14 chiffres').optional().nullable().or(z.literal('')),
  tvaIntracomNumber: z.string().regex(/^FR\d{11}$/, 'Format: FR + 11 chiffres').optional().nullable().or(z.literal('')),
  tvaRegime: z.enum(['VAT_APPLIED', 'VAT_EXEMPT_293B']).optional(),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal: 5 chiffres').optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable().or(z.literal('')),
  // Preset announcement messages
  presetMessage1: z.string().max(200).optional().nullable().or(z.literal('')),
  presetMessage2: z.string().max(200).optional().nullable().or(z.literal('')),
  presetMessage3: z.string().max(200).optional().nullable().or(z.literal('')),
  presetMessage4: z.string().max(200).optional().nullable().or(z.literal('')),
});

router.patch('/', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = updateClinicSchema.parse(req.body);

    // Normalize empty strings to null for optional fields
    const normalized = {
      ...data,
      siret: data.siret === '' ? null : data.siret,
      tvaIntracomNumber: data.tvaIntracomNumber === '' ? null : data.tvaIntracomNumber,
      postalCode: data.postalCode === '' ? null : data.postalCode,
      city: data.city === '' ? null : data.city,
    };

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: normalized,
      select: {
        id: true,
        name: true,
        doctorName: true,
        phone: true,
        address: true,
        language: true,
        avgConsultationMins: true,
        notifyAtPosition: true,
        enableWhatsApp: true,
        specialty: true,
        funFactsEnabled: true,
        enableLanguageSwitcher: true,
        queueMode: true,
        rdvGraceMinutes: true,
        enableStepOut: true,
        siret: true,
        tvaIntracomNumber: true,
        tvaRegime: true,
        postalCode: true,
        city: true,
        presetMessage1: true,
        presetMessage2: true,
        presetMessage3: true,
        presetMessage4: true,
      },
    });

    // If queue mode changed, recalculate queue positions
    if (data.queueMode || data.rdvGraceMinutes !== undefined) {
      await recalculatePositionsAndStatuses(clinicId);
      invalidateStatsCache(clinicId);
      emitQueueUpdate(clinicId).catch(() => {});
      emitAllPatientUpdates(clinicId).catch(() => {});
    }

    res.json(updatedClinic);
  } catch (error: any) {
    logger.error({ err: error }, 'Error updating clinic');
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update clinic settings' });
  }
});

// POST /api/clinic/doctor-presence - Toggle doctor presence
router.post('/doctor-presence', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { isDoctorPresent } = z.object({
      isDoctorPresent: z.boolean(),
    }).parse(req.body);

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: { isDoctorPresent },
      select: { id: true, isDoctorPresent: true },
    });

    // Broadcast to all patients in this clinic's room
    emitToRoom(`clinic:${clinicId}:patients`, 'doctor:presence', {
      clinicId,
      isDoctorPresent,
    });

    // Also broadcast to the clinic dashboard (in case multiple tabs open)
    emitToRoom(`clinic:${clinicId}`, 'doctor:presence', {
      clinicId,
      isDoctorPresent,
    });

    // Recalculate queue statuses based on new presence state
    // When toggling ON: position #1 transitions to IN_CONSULTATION
    // When toggling OFF: IN_CONSULTATION drops back to NOTIFIED
    await recalculatePositionsAndStatuses(clinicId);

    // Fire-and-forget: emit socket updates in background
    invalidateStatsCache(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});
    emitAllPatientUpdates(clinicId).catch(() => {});

    res.json({ data: updatedClinic });
  } catch (error: any) {
    logger.error({ err: error }, 'Error updating doctor presence');
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update doctor presence' });
  }
});

// POST /api/clinic/announcement - Set or clear announcement for all patients
router.post('/announcement', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { announcement } = z.object({
      announcement: z.string().max(500).nullable(),
    }).parse(req.body);

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        announcement,
        announcementAt: announcement ? new Date() : null,
      },
      select: { id: true, announcement: true, announcementAt: true },
    });

    // Broadcast to all patients in this clinic's room
    emitToRoom(`clinic:${clinicId}:patients`, 'clinic:announcement', {
      clinicId,
      announcement: updatedClinic.announcement,
      announcementAt: updatedClinic.announcementAt,
    });

    // Also broadcast to the clinic dashboard (in case multiple tabs open)
    emitToRoom(`clinic:${clinicId}`, 'clinic:announcement', {
      clinicId,
      announcement: updatedClinic.announcement,
      announcementAt: updatedClinic.announcementAt,
    });

    res.json({ data: updatedClinic });
  } catch (error: any) {
    logger.error({ err: error }, 'Error updating announcement');
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// GET /api/clinic/:clinicId/info - Public endpoint for clinic info (for check-in page)
router.get('/:clinicId/info', async (req, res: Response) => {
  try {
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        isActive: true,
        avgConsultationMins: true,
        isDoctorPresent: true,
        doctorName: true,
        doctorGender: true,
        specialty: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      });
    }

    if (!clinic.isActive) {
      return res.status(403).json({
        error: { code: 'CLINIC_INACTIVE', message: 'This clinic is currently inactive' },
      });
    }

    // Count waiting patients
    const waitingCount = await prisma.queueEntry.count({
      where: {
        clinicId,
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
    });

    res.json({
      data: {
        name: clinic.name,
        waitingCount,
        avgConsultationMins: clinic.avgConsultationMins,
        isDoctorPresent: clinic.isDoctorPresent,
        doctorName: clinic.doctorName,
        doctorGender: clinic.doctorGender,
        specialty: clinic.specialty,
      },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching clinic info');
    res.status(500).json({ error: 'Failed to fetch clinic info' });
  }
});

// GET /api/clinic/daily-recap - Get yesterday's stats for daily recap overlay
router.get('/daily-recap', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the 2 most recent DailyStat entries
    const recentStats = await prisma.dailyStat.findMany({
      where: { clinicId },
      orderBy: { date: 'desc' },
      take: 2,
    });

    if (recentStats.length === 0) {
      return res.json({ data: { hasData: false } });
    }

    const yesterday = recentStats[0];
    const previousDay = recentStats.length > 1 ? recentStats[1] : null;

    // Get monthly averages (last 30 days of DailyStat records)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyStats = await prisma.dailyStat.findMany({
      where: { clinicId, date: { gte: thirtyDaysAgo } },
    });

    const monthlyAvg = {
      avgPatients: 0,
      avgWaitMins: 0,
      avgConsultationMins: 0,
    };

    if (monthlyStats.length > 0) {
      const totalPatients = monthlyStats.reduce((s, d) => s + d.totalPatients, 0);
      const waitEntries = monthlyStats.filter(d => d.avgWaitMins !== null);
      const consultEntries = monthlyStats.filter(d => d.avgConsultationMins !== null);

      monthlyAvg.avgPatients = Math.round(totalPatients / monthlyStats.length);
      monthlyAvg.avgWaitMins = waitEntries.length > 0
        ? Math.round(waitEntries.reduce((s, d) => s + d.avgWaitMins!, 0) / waitEntries.length)
        : 0;
      monthlyAvg.avgConsultationMins = consultEntries.length > 0
        ? Math.round(consultEntries.reduce((s, d) => s + d.avgConsultationMins!, 0) / consultEntries.length)
        : 0;
    }

    // Calculate trends (% change)
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return Math.round(((current - previous) / previous) * 100);
    };

    const trends = {
      patients: {
        vsPrevDay: previousDay ? calcTrend(yesterday.totalPatients, previousDay.totalPatients) : 0,
        vsMonthly: monthlyAvg.avgPatients > 0 ? calcTrend(yesterday.totalPatients, monthlyAvg.avgPatients) : 0,
      },
      avgWait: {
        vsPrevDay: previousDay?.avgWaitMins != null && yesterday.avgWaitMins != null
          ? calcTrend(yesterday.avgWaitMins, previousDay.avgWaitMins)
          : 0,
        vsMonthly: monthlyAvg.avgWaitMins > 0 && yesterday.avgWaitMins != null
          ? calcTrend(yesterday.avgWaitMins, monthlyAvg.avgWaitMins)
          : 0,
      },
      avgConsultation: {
        vsPrevDay: previousDay?.avgConsultationMins != null && yesterday.avgConsultationMins != null
          ? calcTrend(yesterday.avgConsultationMins, previousDay.avgConsultationMins)
          : 0,
        vsMonthly: monthlyAvg.avgConsultationMins > 0 && yesterday.avgConsultationMins != null
          ? calcTrend(yesterday.avgConsultationMins, monthlyAvg.avgConsultationMins)
          : 0,
      },
    };

    res.json({
      data: {
        hasData: true,
        yesterday: {
          totalPatients: yesterday.totalPatients,
          avgWaitMins: yesterday.avgWaitMins,
          avgConsultationMins: yesterday.avgConsultationMins,
          date: yesterday.date,
        },
        previousDay: previousDay ? {
          totalPatients: previousDay.totalPatients,
          avgWaitMins: previousDay.avgWaitMins,
          avgConsultationMins: previousDay.avgConsultationMins,
          date: previousDay.date,
        } : null,
        monthlyAvg,
        trends,
      },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error fetching daily recap');
    res.status(500).json({ error: 'Failed to fetch daily recap' });
  }
});

// GET /api/clinic/qr - Generate QR code for check-in
router.get('/qr', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Generate check-in URL
    // In production use FRONTEND_URL or Vercel URL; in dev prefer Origin header (auto-tracks Vite port)
    const frontendUrl = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT
      ? (process.env.FRONTEND_URL || 'https://web-zeta-five-39.vercel.app')
      : (req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5174');
    const checkInUrl = `${frontendUrl}/checkin/${clinicId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      margin: 2,
    });

    res.json({
      data: {
        url: checkInUrl,
        qrCode: qrCodeDataUrl,
        clinicName: clinic.name,
      },
    });
  } catch (error: any) {
    logger.error({ err: error }, 'Error generating QR code');
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ─── Activation Checklist ───────────────────────────────────

/**
 * GET /api/clinic/activation-progress
 * Get activation checklist state
 */
router.get('/activation-progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.clinic!.id },
      select: {
        activationQrDownloaded: true,
        activationFirstPatient: true,
        activationChecklistDismissed: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({ error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' } });
    }

    res.json({
      data: {
        accountCreated: true,
        dashboardConfigured: true,
        qrDownloaded: clinic.activationQrDownloaded,
        firstPatientAdded: clinic.activationFirstPatient,
        dismissed: clinic.activationChecklistDismissed,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching activation progress');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch activation progress' } });
  }
});

/**
 * POST /api/clinic/activation-progress
 * Update activation checklist state
 */
router.post('/activation-progress', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { qrDownloaded, firstPatientAdded, dismissed } = req.body;

    const updateData: Record<string, boolean> = {};
    if (qrDownloaded === true) updateData.activationQrDownloaded = true;
    if (firstPatientAdded === true) updateData.activationFirstPatient = true;
    if (dismissed === true) updateData.activationChecklistDismissed = true;

    await prisma.clinic.update({
      where: { id: req.clinic!.id },
      data: updateData,
    });

    res.json({ data: { message: 'Activation progress updated' } });
  } catch (error) {
    logger.error({ err: error }, 'Error updating activation progress');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to update activation progress' } });
  }
});

// GET /api/clinic/feedback/summary - Feedback aggregate data
router.get('/feedback/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { getFeedbackSummary } = await import('../services/feedbackService.js');
    const summary = await getFeedbackSummary(clinicId);
    res.json({ data: summary });
  } catch (error) {
    logger.error({ err: error }, 'Feedback summary error');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch feedback summary' } });
  }
});

export default router;
