import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest, QueueStats } from '../types/index.js';
import { QueueStatus, CheckInMethod } from '@prisma/client';
import { emitToRoom } from '../lib/socket.js';

const router = Router();

// Helper function to emit queue updates to clinic room
async function emitQueueUpdate(clinicId: string) {
  try {
    // Get updated queue
    const queue = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    // Get updated stats
    const stats = await getQueueStats(clinicId);

    // Emit to clinic room
    emitToRoom(`clinic:${clinicId}`, 'queue:updated', { queue, stats });
    console.log(`Emitted queue:updated to clinic:${clinicId}`);
  } catch (error) {
    console.error('Failed to emit queue update:', error);
  }
}

// Helper function to emit patient position update
function emitPatientUpdate(entryId: string, position: number, status: string) {
  const roomName = `patient:${entryId}`;
  console.log(`[Socket.io] Emitting 'patient:called' to room '${roomName}' with position=${position}, status=${status}`);
  emitToRoom(roomName, 'patient:called', { position, status });
}

// Validation schemas
const addPatientSchema = z.object({
  patientPhone: z.string().min(8), // More flexible - will format on server
  patientName: z.string().optional(),
  checkInMethod: z.enum(['QR_CODE', 'MANUAL', 'WHATSAPP', 'SMS']).default('MANUAL'),
  appointmentTime: z.string().optional(), // HH:MM format for today's appointment
  arrivedAt: z.string().optional(), // ISO string for demo/testing - defaults to now() if not provided
});

const updateStatusSchema = z.object({
  status: z.enum(['WAITING', 'NOTIFIED', 'IN_CONSULTATION', 'COMPLETED', 'NO_SHOW', 'CANCELLED']),
  completedAt: z.string().datetime().optional(),
});

// Helper function to recalculate positions AND auto-assign statuses
// Rules:
// - Position #1 should always be IN_CONSULTATION
// - Position #2 should always be NOTIFIED
// - All others should be WAITING
// Ordering: appointmentTime first (nulls last), then arrivedAt for walk-ins
async function recalculatePositionsAndStatuses(clinicId: string) {
  // Get all active patients
  const activePatients = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      status: {
        in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
      },
    },
  });

  // Sort: patients with appointments first (by appointment time), then walk-ins (by arrival time)
  activePatients.sort((a, b) => {
    // Both have appointments - sort by appointment time
    if (a.appointmentTime && b.appointmentTime) {
      return a.appointmentTime.getTime() - b.appointmentTime.getTime();
    }
    // Only a has appointment - a comes first
    if (a.appointmentTime && !b.appointmentTime) {
      return -1;
    }
    // Only b has appointment - b comes first
    if (!a.appointmentTime && b.appointmentTime) {
      return 1;
    }
    // Neither has appointment (both walk-ins) - sort by arrival time
    return a.arrivedAt.getTime() - b.arrivedAt.getTime();
  });

  if (activePatients.length === 0) {
    return;
  }

  // Update positions and statuses sequentially
  await Promise.all(
    activePatients.map((entry, index) => {
      const newPosition = index + 1;
      let newStatus: QueueStatus;
      const updateData: { position: number; status: QueueStatus; calledAt?: Date; notifiedAt?: Date } = {
        position: newPosition,
        status: entry.status, // Default to current status
      };

      // Position #1 = IN_CONSULTATION
      if (newPosition === 1) {
        newStatus = QueueStatus.IN_CONSULTATION;
        updateData.status = newStatus;
        // Set calledAt if not already set
        if (!entry.calledAt) {
          updateData.calledAt = new Date();
        }
      }
      // Position #2 = NOTIFIED
      else if (newPosition === 2) {
        newStatus = QueueStatus.NOTIFIED;
        updateData.status = newStatus;
        // Set notifiedAt if not already set
        if (!entry.notifiedAt) {
          updateData.notifiedAt = new Date();
        }
      }
      // All others = WAITING
      else {
        newStatus = QueueStatus.WAITING;
        updateData.status = newStatus;
      }

      return prisma.queueEntry.update({
        where: { id: entry.id },
        data: updateData,
      });
    })
  );
}

// Legacy function name for backward compatibility
async function recalculatePositions(clinicId: string) {
  return recalculatePositionsAndStatuses(clinicId);
}

// Helper function to calculate queue stats
// Average wait time = time from arrivedAt to calledAt (when patient starts consultation)
// Last consultation duration = time from calledAt to completedAt of the most recent COMPLETED patient
async function getQueueStats(clinicId: string): Promise<QueueStats> {
  const [waitingInQueue, seenPatients, lastCompletedPatient] = await Promise.all([
    // Count patients waiting in queue (WAITING + NOTIFIED, excluding IN_CONSULTATION)
    prisma.queueEntry.count({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
      },
    }),
    prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.IN_CONSULTATION, QueueStatus.COMPLETED],
        },
      },
      select: { arrivedAt: true, calledAt: true },
    }),
    // Get the most recently completed patient to calculate last consultation duration
    prisma.queueEntry.findFirst({
      where: {
        clinicId,
        status: QueueStatus.COMPLETED,
        calledAt: { not: null },
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      select: { calledAt: true, completedAt: true },
    }),
  ]);

  // Filter entries that have both arrivedAt and calledAt timestamps
  // calledAt is set when patient moves to IN_CONSULTATION status
  const patientsWithWaitTime = seenPatients.filter(
    (entry) => entry.arrivedAt && entry.calledAt
  );

  let avgWait = null;
  if (patientsWithWaitTime.length > 0) {
    const totalWait = patientsWithWaitTime.reduce((sum, entry) => {
      // Wait time = time from arrival to being called for consultation
      const wait = entry.calledAt!.getTime() - entry.arrivedAt!.getTime();
      return sum + wait;
    }, 0);
    avgWait = Math.round(totalWait / patientsWithWaitTime.length / 60000); // Convert to minutes
  }

  // Calculate last consultation duration (time from calledAt to completedAt)
  let lastConsultationMins = null;
  if (lastCompletedPatient && lastCompletedPatient.calledAt && lastCompletedPatient.completedAt) {
    const duration = lastCompletedPatient.completedAt.getTime() - lastCompletedPatient.calledAt.getTime();
    lastConsultationMins = Math.round(duration / 60000); // Convert to minutes
  }

  return {
    waiting: waitingInQueue,
    seen: seenPatients.length,
    avgWait,
    lastConsultationMins,
  };
}

// GET /api/queue - Get today's queue
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;

    const queue = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    const stats = await getQueueStats(clinicId);

    res.json({
      data: {
        queue,
        stats,
      },
    });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get queue',
      },
    });
  }
});

// POST /api/queue - Add patient to queue
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { patientPhone, patientName, checkInMethod, appointmentTime, arrivedAt } = addPatientSchema.parse(req.body);

    // Parse appointment time if provided (HH:MM format -> today's DateTime)
    let appointmentDateTime: Date | undefined;
    if (appointmentTime) {
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        appointmentDateTime = new Date();
        appointmentDateTime.setHours(hours, minutes, 0, 0);
      }
    }

    // Parse arrivedAt if provided (for demo/testing), otherwise use current time
    let arrivedAtDateTime: Date | undefined;
    if (arrivedAt) {
      arrivedAtDateTime = new Date(arrivedAt);
    }

    // Format phone number
    const formattedPhone = patientPhone.startsWith('+216')
      ? patientPhone
      : `+216${patientPhone.replace(/\D/g, '')}`;

    // Check for duplicate check-in (same phone, active status, today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        clinicId,
        patientPhone: formattedPhone,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
        arrivedAt: {
          gte: today,
        },
      },
    });

    if (existingEntry) {
      return res.status(400).json({
        error: {
          code: 'ALREADY_CHECKED_IN',
          message: 'This patient is already in the queue',
        },
        data: existingEntry,
      });
    }

    // Get current max position across all active statuses
    const maxPosition = await prisma.queueEntry.findFirst({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (maxPosition?.position || 0) + 1;

    // Create queue entry with initial WAITING status
    const entry = await prisma.queueEntry.create({
      data: {
        clinicId,
        patientPhone: formattedPhone,
        patientName,
        position,
        status: QueueStatus.WAITING,
        checkInMethod: checkInMethod as CheckInMethod,
        appointmentTime: appointmentDateTime,
        ...(arrivedAtDateTime && { arrivedAt: arrivedAtDateTime }),
      },
    });

    // Recalculate positions and auto-assign statuses
    // This will set: position #1 = IN_CONSULTATION, position #2 = NOTIFIED
    await recalculatePositionsAndStatuses(clinicId);

    // Fetch the updated entry to return correct status
    const updatedEntry = await prisma.queueEntry.findUnique({
      where: { id: entry.id },
    });

    // Emit real-time update to dashboard
    await emitQueueUpdate(clinicId);

    // TODO: Send SMS notification (will implement in Phase 3)

    res.status(201).json({ data: updatedEntry || entry });
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

    console.error('Add patient error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to add patient',
      },
    });
  }
});

// POST /api/queue/next - Call next patient
router.post('/next', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;

    // First, complete the patient currently in consultation (position #1)
    const currentInConsultation = await prisma.queueEntry.findFirst({
      where: {
        clinicId,
        status: QueueStatus.IN_CONSULTATION,
      },
    });

    if (currentInConsultation) {
      await prisma.queueEntry.update({
        where: { id: currentInConsultation.id },
        data: {
          status: QueueStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
    }

    // Check if there are any remaining patients
    const remainingPatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED],
        },
      },
    });

    if (remainingPatients.length === 0) {
      // No more patients waiting
      await emitQueueUpdate(clinicId);
      return res.status(404).json({
        error: {
          code: 'NO_PATIENTS',
          message: 'No patients waiting',
        },
      });
    }

    // Recalculate positions and statuses
    // This will automatically:
    // - Move the next patient (was #2 NOTIFIED) to #1 IN_CONSULTATION
    // - Move #3 to #2 NOTIFIED
    // - All others remain WAITING
    await recalculatePositionsAndStatuses(clinicId);

    // Get ALL updated patients to emit real-time updates to each one
    const updatedPatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    // Emit real-time updates to the dashboard
    await emitQueueUpdate(clinicId);

    // Emit updates to EACH patient's status page so they see their new position/status
    for (const patient of updatedPatients) {
      emitPatientUpdate(patient.id, patient.position, patient.status);
    }

    // Find the new in consultation patient for the response
    const newInConsultation = updatedPatients.find(p => p.status === QueueStatus.IN_CONSULTATION);

    res.json({ data: newInConsultation });
  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to call next patient',
      },
    });
  }
});

// PATCH /api/queue/:id/status - Update patient status
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const { status, completedAt } = updateStatusSchema.parse(req.body);

    // Verify entry belongs to clinic
    const entry = await prisma.queueEntry.findFirst({
      where: { id, clinicId },
    });

    if (!entry) {
      return res.status(404).json({
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Queue entry not found',
        },
      });
    }

    // Update entry
    const updated = await prisma.queueEntry.update({
      where: { id },
      data: {
        status: status as QueueStatus,
        ...(completedAt && { completedAt: new Date(completedAt) }),
      },
    });

    // Recalculate positions if status changed
    if (status !== QueueStatus.WAITING) {
      await recalculatePositions(clinicId);
    }

    // Emit real-time updates
    await emitQueueUpdate(clinicId);
    emitPatientUpdate(updated.id, updated.position, updated.status);

    res.json({ data: updated });
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

    console.error('Update status error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to update status',
      },
    });
  }
});

// DELETE /api/queue/:id - Remove patient from queue
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    // Verify entry belongs to clinic
    const entry = await prisma.queueEntry.findFirst({
      where: { id, clinicId },
    });

    if (!entry) {
      return res.status(404).json({
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Queue entry not found',
        },
      });
    }

    await prisma.queueEntry.delete({ where: { id } });

    // Recalculate positions and statuses
    await recalculatePositionsAndStatuses(clinicId);

    // Get ALL updated patients to emit real-time updates
    const updatedPatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    // Emit real-time update to dashboard
    await emitQueueUpdate(clinicId);

    // Emit updates to EACH patient's status page
    for (const patient of updatedPatients) {
      emitPatientUpdate(patient.id, patient.position, patient.status);
    }

    res.json({ data: { message: 'Patient removed from queue' } });
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to remove patient',
      },
    });
  }
});

// POST /api/queue/reorder - Manually reorder queue (receptionist override)
const reorderSchema = z.object({
  entryId: z.string().uuid(),
  newPosition: z.number().int().min(1),
});

router.post('/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { entryId, newPosition } = reorderSchema.parse(req.body);

    // Verify entry belongs to clinic and is active
    const entry = await prisma.queueEntry.findFirst({
      where: {
        id: entryId,
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
    });

    if (!entry) {
      return res.status(404).json({
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Queue entry not found or not active',
        },
      });
    }

    const oldPosition = entry.position;

    // Get all active patients
    const activePatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    // Validate new position
    if (newPosition > activePatients.length) {
      return res.status(400).json({
        error: {
          code: 'INVALID_POSITION',
          message: `Position must be between 1 and ${activePatients.length}`,
        },
      });
    }

    if (oldPosition === newPosition) {
      return res.json({ data: { message: 'Position unchanged' } });
    }

    // Reorder: shift other patients and place the moved patient at new position
    // First, temporarily set moved patient's position to 0 to avoid conflicts
    await prisma.queueEntry.update({
      where: { id: entryId },
      data: { position: 0 },
    });

    // Shift other patients
    if (newPosition < oldPosition) {
      // Moving up: shift patients between newPosition and oldPosition down
      await prisma.queueEntry.updateMany({
        where: {
          clinicId,
          position: { gte: newPosition, lt: oldPosition },
          id: { not: entryId },
          status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
        },
        data: { position: { increment: 1 } },
      });
    } else {
      // Moving down: shift patients between oldPosition and newPosition up
      await prisma.queueEntry.updateMany({
        where: {
          clinicId,
          position: { gt: oldPosition, lte: newPosition },
          id: { not: entryId },
          status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
        },
        data: { position: { decrement: 1 } },
      });
    }

    // Set the moved patient to new position
    await prisma.queueEntry.update({
      where: { id: entryId },
      data: { position: newPosition },
    });

    // Recalculate statuses based on new positions (position 1 = IN_CONSULTATION, 2 = NOTIFIED)
    const reorderedPatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
      orderBy: { position: 'asc' },
    });

    // Update statuses based on position
    await Promise.all(
      reorderedPatients.map((patient) => {
        let newStatus: QueueStatus;
        const updateData: { status: QueueStatus; calledAt?: Date; notifiedAt?: Date } = {
          status: patient.status,
        };

        if (patient.position === 1) {
          newStatus = QueueStatus.IN_CONSULTATION;
          if (!patient.calledAt) {
            updateData.calledAt = new Date();
          }
        } else if (patient.position === 2) {
          newStatus = QueueStatus.NOTIFIED;
          if (!patient.notifiedAt) {
            updateData.notifiedAt = new Date();
          }
        } else {
          newStatus = QueueStatus.WAITING;
        }

        updateData.status = newStatus;

        return prisma.queueEntry.update({
          where: { id: patient.id },
          data: updateData,
        });
      })
    );

    // Emit real-time updates
    await emitQueueUpdate(clinicId);

    // Emit to each patient
    const finalPatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: { in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION] },
      },
      orderBy: { position: 'asc' },
    });

    for (const patient of finalPatients) {
      emitPatientUpdate(patient.id, patient.position, patient.status);
    }

    res.json({
      data: {
        message: 'Queue reordered successfully',
        entry: await prisma.queueEntry.findUnique({ where: { id: entryId } }),
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

    console.error('Reorder queue error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to reorder queue',
      },
    });
  }
});

// DELETE /api/queue - Clear all patients from queue
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;

    // Delete all active queue entries for this clinic
    const result = await prisma.queueEntry.deleteMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
    });

    // Emit real-time update to dashboard
    await emitQueueUpdate(clinicId);

    res.json({ data: { message: 'Queue cleared', count: result.count } });
  } catch (error) {
    console.error('Clear queue error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to clear queue',
      },
    });
  }
});

// POST /api/queue/reset-stats - Reset average wait time by clearing calledAt timestamps
router.post('/reset-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;

    // Reset calledAt for COMPLETED entries (removes them from avg wait calculation)
    // Also delete all COMPLETED entries to reset the "seen today" count
    const result = await prisma.queueEntry.deleteMany({
      where: {
        clinicId,
        status: QueueStatus.COMPLETED,
      },
    });

    // Emit real-time update to dashboard with fresh stats
    await emitQueueUpdate(clinicId);

    res.json({ data: { message: 'Statistics reset', deletedCount: result.count } });
  } catch (error) {
    console.error('Reset stats error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to reset statistics',
      },
    });
  }
});

// PUBLIC ENDPOINTS (No authentication required)

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
        error: {
          code: 'CLINIC_NOT_FOUND',
          message: 'Clinic not found or inactive',
        },
      });
    }

    // Format phone number
    const formattedPhone = patientPhone.startsWith('+216')
      ? patientPhone
      : `+216${patientPhone.replace(/\D/g, '')}`;

    // Check for duplicate check-in (same phone, waiting status, today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingEntry = await prisma.queueEntry.findFirst({
      where: {
        clinicId,
        patientPhone: formattedPhone,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
        arrivedAt: {
          gte: today,
        },
      },
    });

    if (existingEntry) {
      return res.status(400).json({
        error: {
          code: 'ALREADY_CHECKED_IN',
          message: 'You are already in the queue',
        },
        data: existingEntry,
      });
    }

    // Get current max position across all active statuses
    const maxPosition = await prisma.queueEntry.findFirst({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const position = (maxPosition?.position || 0) + 1;

    // Create queue entry with initial WAITING status
    const entry = await prisma.queueEntry.create({
      data: {
        clinicId,
        patientPhone: formattedPhone,
        patientName,
        position,
        status: QueueStatus.WAITING,
        checkInMethod: CheckInMethod.QR_CODE,
      },
    });

    // Recalculate positions and auto-assign statuses
    // This will set: position #1 = IN_CONSULTATION, position #2 = NOTIFIED
    await recalculatePositionsAndStatuses(clinicId);

    // Fetch the updated entry to return correct status and position
    const updatedEntry = await prisma.queueEntry.findUnique({
      where: { id: entry.id },
    });

    // Calculate estimated wait time based on updated position
    const finalEntry = updatedEntry || entry;
    const estimatedWaitMins = finalEntry.position * clinic.avgConsultationMins;

    // Emit real-time update to dashboard
    await emitQueueUpdate(clinicId);

    // If the new patient became IN_CONSULTATION or NOTIFIED (first/second in queue),
    // emit update to their status page
    if (finalEntry.status === QueueStatus.IN_CONSULTATION || finalEntry.status === QueueStatus.NOTIFIED) {
      emitPatientUpdate(finalEntry.id, finalEntry.position, finalEntry.status);
    }

    // TODO: Send SMS notification (will implement next)

    res.status(201).json({
      data: {
        ...finalEntry,
        clinicName: clinic.name,
        estimatedWaitMins,
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

    console.error('Patient check-in error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to check in',
      },
    });
  }
});

// POST /api/queue/patient/:entryId/leave - Patient self-removal from queue (public)
router.post('/patient/:entryId/leave', async (req, res: Response) => {
  try {
    const { entryId } = req.params;

    // Find the queue entry
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) {
      return res.status(404).json({
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Queue entry not found',
        },
      });
    }

    // Check if patient can leave (not already completed/cancelled/no-show)
    const nonLeavableStatuses: QueueStatus[] = [QueueStatus.COMPLETED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW];
    if (nonLeavableStatuses.includes(entry.status)) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_LEAVE',
          message: 'Cannot leave queue in current status',
        },
      });
    }

    const clinicId = entry.clinicId;

    // Update status to CANCELLED (patient chose to leave)
    await prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: QueueStatus.CANCELLED,
      },
    });

    // Recalculate positions and statuses for remaining patients
    await recalculatePositionsAndStatuses(clinicId);

    // Get ALL updated patients to emit real-time updates
    const updatedPatients = await prisma.queueEntry.findMany({
      where: {
        clinicId,
        status: {
          in: [QueueStatus.WAITING, QueueStatus.NOTIFIED, QueueStatus.IN_CONSULTATION],
        },
      },
      orderBy: { position: 'asc' },
    });

    // Emit real-time update to dashboard
    await emitQueueUpdate(clinicId);

    // Emit updates to EACH remaining patient's status page
    for (const patient of updatedPatients) {
      emitPatientUpdate(patient.id, patient.position, patient.status);
    }

    // Emit update to the leaving patient (so their page updates to cancelled state)
    emitPatientUpdate(entryId, 0, QueueStatus.CANCELLED);

    res.json({
      data: {
        message: 'Successfully left the queue',
        status: QueueStatus.CANCELLED,
      },
    });
  } catch (error) {
    console.error('Patient leave queue error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to leave queue',
      },
    });
  }
});

// GET /api/queue/patient/:entryId - Get patient status (public)
router.get('/patient/:entryId', async (req, res: Response) => {
  try {
    const { entryId } = req.params;

    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: {
        clinic: {
          select: {
            name: true,
            avgConsultationMins: true,
            isDoctorPresent: true,
          },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({
        error: {
          code: 'ENTRY_NOT_FOUND',
          message: 'Queue entry not found',
        },
      });
    }

    // Calculate estimated wait time
    const estimatedWaitMins = entry.position * entry.clinic.avgConsultationMins;

    res.json({
      data: {
        id: entry.id,
        clinicId: entry.clinicId,
        patientName: entry.patientName,
        position: entry.position,
        status: entry.status,
        arrivedAt: entry.arrivedAt,
        estimatedWaitMins,
        clinicName: entry.clinic.name,
        isDoctorPresent: entry.clinic.isDoctorPresent,
      },
    });
  } catch (error) {
    console.error('Get patient status error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get patient status',
      },
    });
  }
});

export default router;
