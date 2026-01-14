import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  appointmentQuerySchema,
  parseTime,
  formatTime,
} from '../lib/validation.js';
import { AuthRequest, WorkingHours, DayHours } from '../types/index.js';
import { io } from '../index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/appointments - List appointments with filters
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const queryValidation = appointmentQuerySchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: queryValidation.error.flatten().fieldErrors,
      });
    }

    const { page, limit, date, doctorId, patientId, status, from, to } = queryValidation.data;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { clinicId };

    if (date) {
      const dateObj = new Date(date);
      dateObj.setHours(0, 0, 0, 0);
      where.date = dateObj;
    }

    if (from || to) {
      where.date = {};
      if (from) (where.date as Record<string, Date>).gte = new Date(from);
      if (to) (where.date as Record<string, Date>).lte = new Date(to);
    }

    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: { id: true, name: true, color: true, specialty: true },
          },
          patient: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { startTime: 'asc' },
        skip,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ]);

    res.json({
      data: appointments,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch appointments',
    });
  }
});

// GET /api/appointments/:id - Get single appointment
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    const appointment = await prisma.appointment.findFirst({
      where: { id, clinicId },
      include: {
        doctor: true,
        patient: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch appointment',
    });
  }
});

// POST /api/appointments - Create appointment
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const validation = createAppointmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const { doctorId, patientId, date, startTime, duration, reason, notes } = validation.data;

    // Verify doctor exists and is active
    const doctor = await prisma.doctor.findFirst({
      where: { id: doctorId, clinicId, isActive: true },
    });

    if (!doctor) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Doctor not found or inactive',
      });
    }

    // Verify patient exists
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Patient not found',
      });
    }

    // Parse date and times
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const startTimeDate = parseTime(startTime, dateObj);
    const endTimeDate = new Date(startTimeDate.getTime() + duration * 60000);

    // Check working hours
    const workingHours = doctor.workingHours as WorkingHours | null;
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dateObj.getDay()] as keyof WorkingHours;
    const dayHours = workingHours?.[dayName] as DayHours | null | undefined;

    if (!dayHours) {
      return res.status(400).json({
        error: 'OUTSIDE_HOURS',
        message: `Doctor does not work on ${dayName}`,
      });
    }

    const workStart = parseTime(dayHours.start, dateObj);
    const workEnd = parseTime(dayHours.end, dateObj);

    if (startTimeDate < workStart || endTimeDate > workEnd) {
      return res.status(400).json({
        error: 'OUTSIDE_HOURS',
        message: `Appointment must be between ${dayHours.start} and ${dayHours.end}`,
      });
    }

    // Check for overlapping appointments
    const overlapping = await prisma.appointment.findFirst({
      where: {
        doctorId,
        date: dateObj,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            // New appointment starts during existing
            startTime: { lte: startTimeDate },
            endTime: { gt: startTimeDate },
          },
          {
            // New appointment ends during existing
            startTime: { lt: endTimeDate },
            endTime: { gte: endTimeDate },
          },
          {
            // New appointment contains existing
            startTime: { gte: startTimeDate },
            endTime: { lte: endTimeDate },
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(409).json({
        error: 'DOUBLE_BOOKING',
        message: 'This time slot is already booked',
        details: {
          existingAppointmentId: overlapping.id,
          requestedTime: startTime,
          conflictingTime: `${formatTime(overlapping.startTime)}-${formatTime(overlapping.endTime)}`,
        },
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        clinicId,
        doctorId,
        patientId,
        date: dateObj,
        startTime: startTimeDate,
        endTime: endTimeDate,
        duration,
        reason,
        notes,
      },
      include: {
        doctor: { select: { id: true, name: true, color: true } },
        patient: { select: { id: true, name: true, phone: true } },
      },
    });

    // Emit socket event
    io.to(`clinic:${clinicId}`).emit('appointment:created', { appointment });

    res.status(201).json({ data: appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create appointment',
    });
  }
});

// PATCH /api/appointments/:id - Update appointment
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const validation = updateAppointmentSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      });
    }

    // Check appointment exists
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId },
      include: { doctor: true },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    const { date, startTime, duration, status, reason, notes } = validation.data;
    const updateData: Record<string, unknown> = {};

    // Handle time changes
    if (date || startTime || duration) {
      const newDate = date ? new Date(date) : existing.date;
      newDate.setHours(0, 0, 0, 0);

      const newStartTime = startTime
        ? parseTime(startTime, newDate)
        : existing.startTime;

      const newDuration = duration || existing.duration;
      const newEndTime = new Date(newStartTime.getTime() + newDuration * 60000);

      // Check for overlapping (excluding current appointment)
      const overlapping = await prisma.appointment.findFirst({
        where: {
          doctorId: existing.doctorId,
          date: newDate,
          id: { not: id },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              startTime: { lte: newStartTime },
              endTime: { gt: newStartTime },
            },
            {
              startTime: { lt: newEndTime },
              endTime: { gte: newEndTime },
            },
            {
              startTime: { gte: newStartTime },
              endTime: { lte: newEndTime },
            },
          ],
        },
      });

      if (overlapping) {
        return res.status(409).json({
          error: 'DOUBLE_BOOKING',
          message: 'This time slot is already booked',
        });
      }

      updateData.date = newDate;
      updateData.startTime = newStartTime;
      updateData.endTime = newEndTime;
      updateData.duration = newDuration;
    }

    if (status) updateData.status = status;
    if (reason !== undefined) updateData.reason = reason;
    if (notes !== undefined) updateData.notes = notes;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        doctor: { select: { id: true, name: true, color: true } },
        patient: { select: { id: true, name: true, phone: true } },
      },
    });

    // Emit socket event
    io.to(`clinic:${clinicId}`).emit('appointment:updated', {
      appointment,
      changes: validation.data,
    });

    res.json({ data: appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update appointment',
    });
  }
});

// DELETE /api/appointments/:id - Cancel appointment
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const reason = req.query.reason as string | undefined;

    // Check appointment exists
    const existing = await prisma.appointment.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    // Soft delete - set status to CANCELLED
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason
          ? `${existing.notes || ''}\n[Cancelled: ${reason}]`.trim()
          : existing.notes,
      },
    });

    // Emit socket event
    io.to(`clinic:${clinicId}`).emit('appointment:cancelled', {
      appointmentId: id,
      reason,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to cancel appointment',
    });
  }
});

// POST /api/appointments/:id/checkin - Check patient into DoctorQ queue
router.post('/:id/checkin', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    // Get appointment with patient info
    const appointment = await prisma.appointment.findFirst({
      where: { id, clinicId },
      include: { patient: true },
    });

    if (!appointment) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Appointment not found',
      });
    }

    if (appointment.status === 'CHECKED_IN') {
      return res.status(409).json({
        error: 'ALREADY_CHECKED_IN',
        message: 'Patient is already checked in',
        details: { queueEntryId: appointment.queueEntryId },
      });
    }

    if (appointment.status === 'CANCELLED' || appointment.status === 'NO_SHOW') {
      return res.status(400).json({
        error: 'INVALID_STATUS',
        message: `Cannot check in a ${appointment.status.toLowerCase()} appointment`,
      });
    }

    // Get current queue position
    const waitingCount = await prisma.queueEntry.count({
      where: {
        clinicId,
        status: 'WAITING',
      },
    });

    const position = waitingCount + 1;

    // Create queue entry in DoctorQ
    const queueEntry = await prisma.queueEntry.create({
      data: {
        clinicId,
        patientName: appointment.patient.name,
        patientPhone: appointment.patient.phone,
        position,
        status: 'WAITING',
        checkInMethod: 'APPOINTMENT',
        appointmentTime: appointment.startTime,
        appointmentId: appointment.id,
      },
    });

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CHECKED_IN',
        queueEntryId: queueEntry.id,
      },
    });

    // Get clinic for wait time calculation
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    const estimatedWait = position * (clinic?.avgConsultationMins || 15);

    // Emit socket events
    io.to(`clinic:${clinicId}`).emit('patient:checked_in', {
      appointmentId: id,
      queueEntryId: queueEntry.id,
      position,
    });

    res.json({
      data: {
        appointmentId: id,
        queueEntryId: queueEntry.id,
        position,
        estimatedWait,
        status: 'CHECKED_IN',
      },
    });
  } catch (error) {
    console.error('Error checking in patient:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to check in patient',
    });
  }
});

export default router;
