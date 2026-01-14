import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import {
  createDoctorSchema,
  updateDoctorSchema,
  dateSchema,
  parseTime,
  formatTime,
} from '../lib/validation.js';
import { AuthRequest, WorkingHours, DayHours } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/doctors - List all doctors
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const activeOnly = req.query.active !== 'false';

    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { name: 'asc' },
    });

    res.json({ data: doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch doctors',
    });
  }
});

// GET /api/doctors/:id - Get single doctor
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    const doctor = await prisma.doctor.findFirst({
      where: { id, clinicId },
    });

    if (!doctor) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Doctor not found',
      });
    }

    res.json({ data: doctor });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch doctor',
    });
  }
});

// POST /api/doctors - Create doctor
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const validation = createDoctorSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const doctor = await prisma.doctor.create({
      data: {
        clinicId,
        ...validation.data,
      },
    });

    res.status(201).json({ data: doctor });
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create doctor',
    });
  }
});

// PATCH /api/doctors/:id - Update doctor
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const validation = updateDoctorSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      });
    }

    // Check doctor exists and belongs to clinic
    const existing = await prisma.doctor.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Doctor not found',
      });
    }

    const doctor = await prisma.doctor.update({
      where: { id },
      data: validation.data,
    });

    res.json({ data: doctor });
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update doctor',
    });
  }
});

// DELETE /api/doctors/:id - Soft delete doctor
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    // Check doctor exists and belongs to clinic
    const existing = await prisma.doctor.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Doctor not found',
      });
    }

    // Soft delete by setting isActive to false
    await prisma.doctor.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting doctor:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete doctor',
    });
  }
});

// GET /api/doctors/:id/availability - Get available slots for a date
router.get('/:id/availability', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const dateValidation = dateSchema.safeParse(req.query.date);

    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const dateStr = dateValidation.data;
    const requestedDuration = Number(req.query.duration) || undefined;

    // Fetch doctor
    const doctor = await prisma.doctor.findFirst({
      where: { id, clinicId, isActive: true },
    });

    if (!doctor) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Doctor not found',
      });
    }

    const duration = requestedDuration || doctor.slotDuration;
    const workingHours = doctor.workingHours as WorkingHours | null;

    // Get day of week
    const date = new Date(dateStr);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()] as keyof WorkingHours;
    const dayHours = workingHours?.[dayName] as DayHours | null | undefined;

    if (!dayHours) {
      return res.json({
        data: {
          date: dateStr,
          doctorId: id,
          workingHours: null,
          availableSlots: [],
          bookedSlots: [],
        },
      });
    }

    // Get existing appointments for this day
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: id,
        date: startOfDay,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    const bookedSlots = appointments.map((apt) => ({
      start: formatTime(apt.startTime),
      end: formatTime(apt.endTime),
      appointmentId: apt.id,
    }));

    // Generate available slots
    const availableSlots: { start: string; end: string }[] = [];
    const workStart = parseTime(dayHours.start, date);
    const workEnd = parseTime(dayHours.end, date);

    let current = new Date(workStart);

    while (current.getTime() + duration * 60000 <= workEnd.getTime()) {
      const slotEnd = new Date(current.getTime() + duration * 60000);

      // Check if slot overlaps with any booked appointment
      const isBooked = appointments.some((apt) => {
        const aptStart = apt.startTime.getTime();
        const aptEnd = apt.endTime.getTime();
        const slotStart = current.getTime();
        const slotEndTime = slotEnd.getTime();

        return slotStart < aptEnd && slotEndTime > aptStart;
      });

      if (!isBooked) {
        availableSlots.push({
          start: formatTime(current),
          end: formatTime(slotEnd),
        });
      }

      // Move to next slot (use duration as step)
      current = new Date(current.getTime() + duration * 60000);
    }

    res.json({
      data: {
        date: dateStr,
        doctorId: id,
        workingHours: dayHours,
        availableSlots,
        bookedSlots,
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch availability',
    });
  }
});

export default router;
