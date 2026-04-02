/**
 * Queue Routes
 * HTTP endpoints for queue management
 * Business logic is delegated to services
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import { subscriptionGate } from '../lib/subscriptionGate.js';
import { checkDailyLimit } from '../lib/tierGate.js';
import { AuthRequest } from '../types/index.js';
import { QueueStatus, CheckInMethod, Priority } from '@prisma/client';
import {
  addPatient,
  removePatient,
  callNextPatient,
  patientLeaveQueue,
  getQueue,
  clearQueue,
  getPatientStatus,
  updatePatientStatus,
  formatPhoneNumber,
  ensureDailyReset,
} from '../services/queueService.js';
import { reorderPatient, updateStatusesAfterReorder, recalculatePositionsAndStatuses } from '../services/positionService.js';
import { resetStats, computeSmartWaitEstimate, invalidateStatsCache } from '../services/statsService.js';
import { logger } from '../lib/logger.js';
import { emitQueueUpdate, emitPatientUpdate, emitAllPatientUpdates } from '../services/notificationService.js';
import { localTimeToUtc } from '../lib/timezone.js';

const router = Router();

// Validation schemas
const addPatientSchema = z.object({
  patientPhone: z.string().min(8).optional().or(z.literal('')),
  patientName: z.string().optional(),
  checkInMethod: z.enum(['QR_CODE', 'MANUAL', 'WHATSAPP']).default('MANUAL'),
  appointmentTime: z.string().optional(),
  arrivedAt: z.string().optional(),
  doctorId: z.string().min(1).optional(),
  isUrgent: z.boolean().optional(),
});

const updatePatientSchema = z.object({
  patientPhone: z.string().min(8).optional(),
  patientName: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['WAITING', 'NOTIFIED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
  calledAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
});

const reorderSchema = z.object({
  entryId: z.string().uuid(),
  newPosition: z.number().int().min(1),
});

// GET /api/queue - Get today's queue
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;

    // Lazy cleanup: ensure today's midnight reset ran (idempotent, fast no-op if already done)
    await ensureDailyReset(clinicId);

    const { queue, stats } = await getQueue(clinicId);

    res.json({ data: { queue, stats } });
  } catch (error) {
    logger.error({ err: error }, "Get queue error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get queue' },
    });
  }
});

// POST /api/queue - Add patient to queue
router.post('/', authMiddleware, subscriptionGate, checkDailyLimit, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { patientPhone, patientName, checkInMethod, appointmentTime, arrivedAt, doctorId, isUrgent } = addPatientSchema.parse(req.body);

    // Parse appointment time if provided (converts local time to UTC using brand timezone)
    let appointmentDateTime: Date | undefined;
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        appointmentDateTime = localTimeToUtc(hours, minutes);
      }
    }

    // Parse arrivedAt if provided
    let arrivedAtDateTime: Date | undefined;
    if (arrivedAt) {
      arrivedAtDateTime = new Date(arrivedAt);
    }

    const result = await addPatient({
      clinicId,
      patientPhone,
      patientName,
      checkInMethod: checkInMethod as CheckInMethod,
      appointmentTime: appointmentDateTime,
      arrivedAt: arrivedAtDateTime,
      doctorId,
      isUrgent,
    });

    if (result.isAlreadyCheckedIn) {
      return res.status(400).json({
        error: { code: 'ALREADY_CHECKED_IN', message: 'This patient is already in the queue' },
        data: result.existingEntry,
      });
    }

    res.status(201).json({ data: result.entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, "Add patient error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to add patient' },
    });
  }
});

// POST /api/queue/next - Call next patient
router.post('/next', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined;

    if (!doctorId) {
      return res.status(400).json({
        error: { code: 'DOCTOR_ID_REQUIRED', message: 'doctorId query parameter is required' },
      });
    }

    // Guard: doctor must be present and active to call next patient
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId },
      select: { state: true },
    });
    if (!doctor || doctor.state === 'inactive' || doctor.state === 'absent_today') {
      return res.status(400).json({
        error: { code: 'DOCTOR_NOT_PRESENT', message: 'Cannot call next patient while consultations are paused' },
      });
    }

    const newInConsultation = await callNextPatient(clinicId, doctorId);

    if (!newInConsultation) {
      return res.status(404).json({
        error: { code: 'NO_PATIENTS', message: 'No patients waiting' },
      });
    }

    res.json({ data: newInConsultation });
  } catch (error) {
    logger.error({ err: error }, "Call next error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to call next patient' },
    });
  }
});

// POST /api/queue/:id/urgent - Toggle patient urgency
router.post('/:id/urgent', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const entryId = req.params.id;

    const entry = await prisma.queueEntry.findFirst({
      where: { id: entryId, clinicId },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    const newPriority = entry.priority === Priority.urgent ? Priority.normal : Priority.urgent;

    await prisma.queueEntry.update({
      where: { id: entryId },
      data: { priority: newPriority },
    });

    // Recalculate positions after priority change
    await recalculatePositionsAndStatuses(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});
    emitAllPatientUpdates(clinicId).catch(() => {});

    res.json({ data: { id: entryId, priority: newPriority } });
  } catch (error) {
    logger.error({ err: error }, "Toggle urgent error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle urgency' },
    });
  }
});

// GET /api/queue/yesterday-stats — KPIs for the welcome screen
router.get('/yesterday-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;

    const tz = 'Africa/Tunis';
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const d8ago = new Date(now);
    d8ago.setDate(d8ago.getDate() - 8);

    const d31ago = new Date(now);
    d31ago.setDate(d31ago.getDate() - 31);

    const allStats = await prisma.dailyStat.findMany({
      where: { clinicId, date: { gte: d31ago } },
      orderBy: { date: 'desc' },
    });

    const yesterdayStats = allStats.find(
      (s) => s.date.toISOString().split('T')[0] === yesterdayStr
    );

    if (!yesterdayStats) {
      return res.json({ yesterday: null, trends: null });
    }

    const week7   = allStats.filter((s) => s.date >= d8ago  && s.date < yesterday);
    const month30 = allStats.filter((s) => s.date >= d31ago && s.date < yesterday);

    const avg = (arr: typeof allStats, field: 'totalPatients' | 'avgWaitMins') => {
      if (arr.length === 0) return null;
      return Math.round(arr.reduce((sum, s) => sum + (s[field] ?? 0), 0) / arr.length);
    };

    const pctDelta = (current: number, ref: number | null) => {
      if (ref === null || ref === 0) return null;
      return Math.round(((current - ref) / ref) * 100);
    };

    const avg7p  = avg(week7,   'totalPatients');
    const avg30p = avg(month30, 'totalPatients');
    const avg7w  = avg(week7,   'avgWaitMins');
    const avg30w = avg(month30, 'avgWaitMins');

    return res.json({
      yesterday: {
        totalPatients: yesterdayStats.totalPatients,
        avgWaitMins:   yesterdayStats.avgWaitMins,
        date:          yesterdayStr,
      },
      trends: {
        patients: {
          vs7d:  pctDelta(yesterdayStats.totalPatients, avg7p),
          vs30d: pctDelta(yesterdayStats.totalPatients, avg30p),
        },
        waitMins: {
          vs7d:  pctDelta(yesterdayStats.avgWaitMins ?? 0, avg7w),
          vs30d: pctDelta(yesterdayStats.avgWaitMins ?? 0, avg30w),
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'yesterday-stats error');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch yesterday stats' } });
  }
});

// GET /api/queue/time-saved — "Temps gagné" metric for dashboard
router.get('/time-saved', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const period = (req.query.period as string) || 'today';

    const { getStartOfToday } = await import('../lib/timezone.js');

    if (period === 'today') {
      // Query today's completed entries with remote check-in
      const todayStart = getStartOfToday();
      const entries = await prisma.queueEntry.findMany({
        where: {
          clinicId,
          status: QueueStatus.COMPLETED,
          checkInMethod: { in: [CheckInMethod.QR_CODE, CheckInMethod.WHATSAPP] },
          arrivedAt: { gte: todayStart },
          calledAt: { not: null },
        },
        select: { arrivedAt: true, calledAt: true },
      });

      const totalMinutes = entries.reduce((sum, e) => {
        if (!e.calledAt) return sum;
        const waitMins = Math.round((e.calledAt.getTime() - e.arrivedAt.getTime()) / 60000);
        return sum + Math.max(0, waitMins);
      }, 0);

      res.json({
        data: {
          timeSavedMinutes: totalMinutes,
          timeSavedHours: Math.round(totalMinutes / 6) / 10, // 1 decimal
          remotePatientCount: entries.length,
          period,
        },
      });
    } else {
      // week or month — aggregate from DailyStat
      const daysBack = period === 'week' ? 7 : 30;
      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      const stats = await prisma.dailyStat.findMany({
        where: { clinicId, date: { gte: since } },
        select: { totalWaitMins: true, checkInQr: true, checkInWhatsapp: true, totalPatients: true },
      });

      let totalMinutes = 0;
      let remoteCount = 0;
      for (const s of stats) {
        if (s.totalPatients > 0) {
          const remoteRatio = (s.checkInQr + s.checkInWhatsapp) / s.totalPatients;
          totalMinutes += Math.round(s.totalWaitMins * remoteRatio);
          remoteCount += s.checkInQr + s.checkInWhatsapp;
        }
      }

      res.json({
        data: {
          timeSavedMinutes: totalMinutes,
          timeSavedHours: Math.round(totalMinutes / 6) / 10,
          remotePatientCount: remoteCount,
          period,
        },
      });
    }
  } catch (error) {
    logger.error({ err: error }, 'time-saved error');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to fetch time saved' } });
  }
});

// PATCH /api/queue/:id/status - Update patient status
router.patch('/:id/status', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const { status, calledAt, completedAt } = updateStatusSchema.parse(req.body);

    const updated = await updatePatientStatus(
      clinicId,
      id,
      status as QueueStatus,
      completedAt ? new Date(completedAt) : undefined,
      calledAt ? new Date(calledAt) : undefined
    );

    if (!updated) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    res.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, "Update status error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update status' },
    });
  }
});

// PATCH /api/queue/:id - Update patient details (phone, name)
router.patch('/:id', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const data = updatePatientSchema.parse(req.body);

    // Verify entry belongs to this clinic
    const entry = await prisma.queueEntry.findFirst({
      where: { id, clinicId },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    // Format phone if provided
    const updateData: Record<string, string> = {};
    if (data.patientPhone !== undefined) {
      updateData.patientPhone = formatPhoneNumber(data.patientPhone);
    }
    if (data.patientName !== undefined) {
      updateData.patientName = data.patientName;
    }

    const updated = await prisma.queueEntry.update({
      where: { id },
      data: updateData,
    });

    // Emit queue update so other clients see the change
    emitQueueUpdate(clinicId);

    res.json({ data: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, "Update patient error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update patient' },
    });
  }
});

// DELETE /api/queue/:id - Remove patient from queue
router.delete('/:id', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    const success = await removePatient(clinicId, id);

    if (!success) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    res.json({ data: { message: 'Patient removed from queue' } });
  } catch (error) {
    logger.error({ err: error }, "Delete entry error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to remove patient' },
    });
  }
});

// POST /api/queue/reorder - Manually reorder queue
router.post('/reorder', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { entryId, newPosition } = reorderSchema.parse(req.body);

    // Verify entry belongs to clinic and is active
    const entry = await prisma.queueEntry.findFirst({
      where: {
        id: entryId,
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found or not active' },
      });
    }

    // Get active patient count
    const activeCount = await prisma.queueEntry.count({
      where: {
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
    });

    if (newPosition > activeCount) {
      return res.status(400).json({
        error: { code: 'INVALID_POSITION', message: `Position must be between 1 and ${activeCount}` },
      });
    }

    if (entry.position === newPosition) {
      return res.json({ data: { message: 'Position unchanged' } });
    }

    // Reorder and update statuses
    await reorderPatient(clinicId, entryId, entry.position, newPosition);
    await updateStatusesAfterReorder(clinicId);

    // Get updated entry before firing socket events
    const updatedEntry = await prisma.queueEntry.findUnique({ where: { id: entryId } });

    // Fire-and-forget: emit socket updates in background
    invalidateStatsCache(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});
    emitAllPatientUpdates(clinicId).catch(() => {});

    res.json({
      data: { message: 'Queue reordered successfully', entry: updatedEntry },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, "Reorder queue error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to reorder queue' },
    });
  }
});

// POST /api/queue/:id/emergency - Toggle urgent priority on a patient
router.post('/:id/emergency', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    // Verify entry belongs to clinic and is active
    const entry = await prisma.queueEntry.findFirst({
      where: {
        id,
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
      },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found or not active' },
      });
    }

    // Toggle priority between urgent and normal
    const newPriority = entry.priority === 'urgent' ? 'normal' : 'urgent';
    const updated = await prisma.queueEntry.update({
      where: { id },
      data: { priority: newPriority },
    });

    // Recalculate positions (urgent patients jump to top)
    await recalculatePositionsAndStatuses(clinicId);

    // Emit socket updates
    invalidateStatsCache(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});
    emitAllPatientUpdates(clinicId).catch(() => {});

    res.json({ data: updated });
  } catch (error) {
    logger.error({ err: error }, 'Toggle urgent error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle urgent' },
    });
  }
});

// POST /api/queue/:id/stepped-out - Toggle stepped-out flag on a patient (receptionist)
router.post('/:id/stepped-out', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    const entry = await prisma.queueEntry.findFirst({
      where: {
        id,
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED] },
      },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found or not active' },
      });
    }

    const steppingOut = !entry.isSteppedOut;
    const updated = await prisma.queueEntry.update({
      where: { id },
      data: {
        isSteppedOut: steppingOut,
        steppedOutAt: steppingOut ? new Date() : null,
        ...(steppingOut ? { stepOutCount: { increment: 1 } } : {}),
      },
    });

    await recalculatePositionsAndStatuses(clinicId);
    invalidateStatsCache(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});
    emitAllPatientUpdates(clinicId).catch(() => {});

    res.json({ data: updated });
  } catch (error) {
    logger.error({ err: error }, 'Toggle stepped-out error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle stepped-out' },
    });
  }
});

// DELETE /api/queue - Clear all patients from queue
router.delete('/', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const count = await clearQueue(clinicId);

    res.json({ data: { message: 'Queue cleared', count } });
  } catch (error) {
    logger.error({ err: error }, "Clear queue error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to clear queue' },
    });
  }
});

// POST /api/queue/reset-stats - Reset statistics
router.post('/reset-stats', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const deletedCount = await resetStats(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});

    res.json({ data: { message: 'Statistics reset', deletedCount } });
  } catch (error) {
    logger.error({ err: error }, "Reset stats error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to reset statistics' },
    });
  }
});

// ============ PUBLIC ENDPOINTS ============

// POST /api/queue/checkin/:clinicId - Patient self check-in
router.post('/checkin/:clinicId', async (req, res: Response) => {
  try {
    const { clinicId } = req.params;
    const { patientPhone, patientName, arrivedAt, doctorId } = addPatientSchema.parse({
      ...req.body,
      checkInMethod: 'QR_CODE',
    });

    // Parse arrivedAt if provided (e.g. from simulator with compressed time)
    let arrivedAtDateTime: Date | undefined;
    if (arrivedAt) {
      arrivedAtDateTime = new Date(arrivedAt);
    }

    // Verify clinic exists and is active
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, isActive: true, avgConsultationMins: true },
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

    const result = await addPatient({
      clinicId,
      patientPhone,
      patientName,
      checkInMethod: CheckInMethod.QR_CODE,
      arrivedAt: arrivedAtDateTime,
      doctorId,
    });

    if (result.isAlreadyCheckedIn) {
      return res.status(400).json({
        error: { code: 'ALREADY_CHECKED_IN', message: 'You are already in the queue' },
        data: result.existingEntry,
      });
    }

    const { estimatedWaitMins, minWaitMins, maxWaitMins } = await computeSmartWaitEstimate(
      clinic.id,
      result.entry.position,
      result.entry.doctorId
    );

    res.status(201).json({
      data: {
        ...result.entry,
        clinicName: clinic.name,
        estimatedWaitMins,
        minWaitMins,
        maxWaitMins,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, "Patient check-in error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to check in' },
    });
  }
});

// POST /api/queue/patient/:entryId/leave - Patient self-removal
router.post('/patient/:entryId/leave', async (req, res: Response) => {
  try {
    const { entryId } = req.params;
    const result = await patientLeaveQueue(entryId);

    if (!result.success) {
      return res.status(400).json({
        error: { code: 'CANNOT_LEAVE', message: 'Cannot leave queue in current status' },
      });
    }

    res.json({
      data: { message: 'Successfully left the queue', status: QueueStatus.CANCELLED },
    });
  } catch (error) {
    logger.error({ err: error }, "Patient leave queue error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to leave queue' },
    });
  }
});

// POST /api/queue/patient/:entryId/step-out - Patient steps out of queue (public)
router.post('/patient/:entryId/step-out', async (req, res: Response) => {
  try {
    const { entryId } = req.params;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { clinic: { select: { enableStepOut: true } } },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    if (!entry.clinic.enableStepOut) {
      return res.status(403).json({
        error: { code: 'STEP_OUT_DISABLED', message: 'Step-out is not enabled for this clinic' },
      });
    }

    if (entry.status !== QueueStatus.WAITING) {
      return res.status(400).json({
        error: { code: 'INVALID_STATUS', message: 'Can only step out while waiting' },
      });
    }

    if (entry.position < 3) {
      return res.status(400).json({
        error: { code: 'POSITION_TOO_LOW', message: 'Can only step out from position 3 or higher' },
      });
    }

    if (entry.isSteppedOut) {
      return res.status(400).json({
        error: { code: 'ALREADY_STEPPED_OUT', message: 'Already stepped out' },
      });
    }

    if (entry.stepOutCount >= 2) {
      return res.status(400).json({
        error: { code: 'STEP_OUT_LIMIT', message: 'Maximum step-out limit reached (2)' },
      });
    }

    const updated = await prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        isSteppedOut: true,
        steppedOutAt: new Date(),
        stepOutCount: { increment: 1 },
      },
    });

    await recalculatePositionsAndStatuses(entry.clinicId);
    invalidateStatsCache(entry.clinicId);
    emitQueueUpdate(entry.clinicId).catch(() => {});
    emitAllPatientUpdates(entry.clinicId).catch(() => {});

    res.json({
      data: {
        message: 'Stepped out successfully',
        isSteppedOut: true,
        stepOutCount: updated.stepOutCount,
        steppedOutAt: updated.steppedOutAt,
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Patient step-out error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to step out' },
    });
  }
});

// POST /api/queue/patient/:entryId/step-back - Patient returns to queue (public)
router.post('/patient/:entryId/step-back', async (req, res: Response) => {
  try {
    const { entryId } = req.params;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    if (!entry.isSteppedOut) {
      return res.status(400).json({
        error: { code: 'NOT_STEPPED_OUT', message: 'Patient is not stepped out' },
      });
    }

    await prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        isSteppedOut: false,
        steppedOutAt: null,
      },
    });

    await recalculatePositionsAndStatuses(entry.clinicId);
    invalidateStatsCache(entry.clinicId);
    emitQueueUpdate(entry.clinicId).catch(() => {});
    emitAllPatientUpdates(entry.clinicId).catch(() => {});

    res.json({
      data: { message: 'Returned to queue successfully', isSteppedOut: false },
    });
  } catch (error) {
    logger.error({ err: error }, 'Patient step-back error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to step back' },
    });
  }
});

// GET /api/queue/patient/:entryId - Get patient status (public)
router.get('/patient/:entryId', async (req, res: Response) => {
  try {
    const { entryId } = req.params;
    const status = await getPatientStatus(entryId);

    if (!status) {
      return res.status(404).json({
        error: { code: 'ENTRY_NOT_FOUND', message: 'Queue entry not found' },
      });
    }

    res.json({ data: status });
  } catch (error) {
    logger.error({ err: error }, "Get patient status error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get patient status' },
    });
  }
});

// GET /api/queue/:clinicId/public - Public queue snapshot for check-in page (no auth)
router.get('/:clinicId/public', async (req, res: Response) => {
  try {
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        specialty: true,
        isDoctorPresent: true,
        avgConsultationMins: true,
        isActive: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      });
    }

    // Get today's start (Africa/Tunis)
    const now = new Date();
    const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Tunis' }));
    todayStart.setHours(0, 0, 0, 0);

    // Active entries (WAITING, NOTIFIED, IN_CONSULTATION)
    const activeEntries = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
      orderBy: { position: 'asc' },
      select: {
        position: true,
        patientName: true,
        status: true,
        arrivedAt: true,
      },
    });

    // Total patients today (all statuses)
    const totalToday = await prisma.queueEntry.count({
      where: {
        clinicId,
        createdAt: { gte: todayStart },
      },
    });

    const waitingCount = activeEntries.filter(
      (e) => e.status === QueueStatus.WAITING || e.status === QueueStatus.NOTIFIED
    ).length;

    // Map to public entries (initials only — no PII)
    const entries = activeEntries.slice(0, 4).map((e) => {
      const initial = e.patientName
        ? e.patientName.trim().charAt(0).toUpperCase()
        : '?';
      const waitMinutes = e.arrivedAt
        ? Math.max(0, Math.round((now.getTime() - new Date(e.arrivedAt).getTime()) / 60000))
        : 0;

      return {
        position: e.position,
        initials: initial,
        status: e.status as 'IN_CONSULTATION' | 'NOTIFIED' | 'WAITING',
        waitMinutes,
      };
    });

    res.json({
      clinicId: clinic.id,
      clinicName: clinic.name,
      specialty: clinic.specialty ?? '',
      isDoctorPresent: clinic.isDoctorPresent,
      waitingCount,
      totalToday,
      avgConsultMinutes: clinic.avgConsultationMins,
      entries,
    });
  } catch (error) {
    logger.error({ err: error }, 'Public queue snapshot error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch queue snapshot' },
    });
  }
});

// ── Patient Feedback (Public) ──────────────────────────────

// POST /api/queue/feedback/:entryId - Submit star rating
router.post('/feedback/:entryId', async (req, res: Response) => {
  try {
    const { entryId } = req.params;
    const { rating } = z.object({ rating: z.number().int().min(1).max(5) }).parse(req.body);

    const { submitFeedback } = await import('../services/feedbackService.js');
    const result = await submitFeedback(entryId, rating);
    res.json({ data: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Rating must be 1-5' } });
    }
    const status = error.status || 500;
    if (status < 500) {
      return res.status(status).json({ error: { code: 'FEEDBACK_ERROR', message: error.message } });
    }
    logger.error({ err: error }, 'Feedback submission error');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to submit feedback' } });
  }
});

// POST /api/queue/feedback/:entryId/google-clicked - Track Google review redirect
router.post('/feedback/:entryId/google-clicked', async (req, res: Response) => {
  try {
    const { entryId } = req.params;
    const { recordGoogleClick } = await import('../services/feedbackService.js');
    await recordGoogleClick(entryId);
    res.json({ data: { updated: true } });
  } catch (error: any) {
    const status = error.status || 500;
    if (status < 500) return res.status(status).json({ error: { code: 'NOT_FOUND', message: error.message } });
    logger.error({ err: error }, 'Google click tracking error');
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Failed to track click' } });
  }
});

export default router;
