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
import { AuthRequest } from '../types/index.js';
import { QueueStatus, CheckInMethod } from '@prisma/client';
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
  isEmergency: z.boolean().optional(),
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
router.post('/', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { patientPhone, patientName, checkInMethod, appointmentTime, arrivedAt, isEmergency } = addPatientSchema.parse(req.body);

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
      isEmergency,
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

    // Guard: doctor must be present to call next patient
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { isDoctorPresent: true },
    });
    if (!clinic?.isDoctorPresent) {
      return res.status(400).json({
        error: { code: 'DOCTOR_NOT_PRESENT', message: 'Cannot call next patient while consultations are paused' },
      });
    }

    const newInConsultation = await callNextPatient(clinicId);

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

// POST /api/queue/:id/emergency - Toggle emergency flag on a patient
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

    // Toggle emergency flag
    const updated = await prisma.queueEntry.update({
      where: { id },
      data: { isEmergency: !entry.isEmergency },
    });

    // Recalculate positions (emergency patients jump to #2)
    await recalculatePositionsAndStatuses(clinicId);

    // Emit socket updates
    invalidateStatsCache(clinicId);
    emitQueueUpdate(clinicId).catch(() => {});
    emitAllPatientUpdates(clinicId).catch(() => {});

    res.json({ data: updated });
  } catch (error) {
    logger.error({ err: error }, 'Toggle emergency error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to toggle emergency' },
    });
  }
});

// POST /api/queue/:id/stepped-out - Toggle stepped-out flag on a patient
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

    const updated = await prisma.queueEntry.update({
      where: { id },
      data: { isSteppedOut: !entry.isSteppedOut },
    });

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
    const { patientPhone, patientName, arrivedAt } = addPatientSchema.parse({
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
    });

    if (result.isAlreadyCheckedIn) {
      return res.status(400).json({
        error: { code: 'ALREADY_CHECKED_IN', message: 'You are already in the queue' },
        data: result.existingEntry,
      });
    }

    const { estimatedWaitMins } = await computeSmartWaitEstimate(
      clinic.id,
      result.entry.position,
      result.entry.doctorId
    );

    res.status(201).json({
      data: {
        ...result.entry,
        clinicName: clinic.name,
        estimatedWaitMins,
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

export default router;
