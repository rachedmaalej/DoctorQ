/**
 * Queue Routes
 * HTTP endpoints for queue management
 * Business logic is delegated to services
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
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
} from '../services/queueService.js';
import { reorderPatient, updateStatusesAfterReorder } from '../services/positionService.js';
import { resetStats } from '../services/statsService.js';
import { emitQueueUpdate, emitPatientUpdate, emitAllPatientUpdates } from '../services/notificationService.js';

const router = Router();

// Validation schemas
const addPatientSchema = z.object({
  patientPhone: z.string().min(8),
  patientName: z.string().optional(),
  checkInMethod: z.enum(['QR_CODE', 'MANUAL', 'WHATSAPP', 'SMS']).default('MANUAL'),
  appointmentTime: z.string().optional(),
  arrivedAt: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['WAITING', 'NOTIFIED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
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
    console.error('Get queue error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get queue' },
    });
  }
});

// POST /api/queue - Add patient to queue
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { patientPhone, patientName, checkInMethod, appointmentTime, arrivedAt } = addPatientSchema.parse(req.body);

    // Parse appointment time if provided
    let appointmentDateTime: Date | undefined;
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        appointmentDateTime = new Date();
        appointmentDateTime.setHours(hours, minutes, 0, 0);
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
    console.error('Add patient error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to add patient' },
    });
  }
});

// POST /api/queue/next - Call next patient
router.post('/next', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const newInConsultation = await callNextPatient(clinicId);

    if (!newInConsultation) {
      return res.status(404).json({
        error: { code: 'NO_PATIENTS', message: 'No patients waiting' },
      });
    }

    res.json({ data: newInConsultation });
  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to call next patient' },
    });
  }
});

// PATCH /api/queue/:id/status - Update patient status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const { status, completedAt } = updateStatusSchema.parse(req.body);

    const updated = await updatePatientStatus(
      clinicId,
      id,
      status as QueueStatus,
      completedAt ? new Date(completedAt) : undefined
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
    console.error('Update status error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update status' },
    });
  }
});

// DELETE /api/queue/:id - Remove patient from queue
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
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
    console.error('Delete entry error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to remove patient' },
    });
  }
});

// POST /api/queue/reorder - Manually reorder queue
router.post('/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Emit updates
    await emitQueueUpdate(clinicId);
    await emitAllPatientUpdates(clinicId);

    const updatedEntry = await prisma.queueEntry.findUnique({ where: { id: entryId } });

    res.json({
      data: { message: 'Queue reordered successfully', entry: updatedEntry },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    console.error('Reorder queue error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to reorder queue' },
    });
  }
});

// DELETE /api/queue - Clear all patients from queue
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const count = await clearQueue(clinicId);

    res.json({ data: { message: 'Queue cleared', count } });
  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to clear queue' },
    });
  }
});

// POST /api/queue/reset-stats - Reset statistics
router.post('/reset-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const deletedCount = await resetStats(clinicId);
    await emitQueueUpdate(clinicId);

    res.json({ data: { message: 'Statistics reset', deletedCount } });
  } catch (error) {
    console.error('Reset stats error:', error);
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
    const { patientPhone, patientName } = addPatientSchema.parse({
      ...req.body,
      checkInMethod: 'QR_CODE',
    });

    // Verify clinic exists and is active
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true, isActive: true, avgConsultationMins: true },
    });

    if (!clinic || !clinic.isActive) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found or inactive' },
      });
    }

    const result = await addPatient({
      clinicId,
      patientPhone,
      patientName,
      checkInMethod: CheckInMethod.QR_CODE,
    });

    if (result.isAlreadyCheckedIn) {
      return res.status(400).json({
        error: { code: 'ALREADY_CHECKED_IN', message: 'You are already in the queue' },
        data: result.existingEntry,
      });
    }

    const estimatedWaitMins = result.entry.position * clinic.avgConsultationMins;

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
    console.error('Patient check-in error:', error);
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
    console.error('Patient leave queue error:', error);
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
    console.error('Get patient status error:', error);
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get patient status' },
    });
  }
});

export default router;
