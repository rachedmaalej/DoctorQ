import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import { dateSchema, parseTime, formatTime } from '../lib/validation.js';
import { AuthRequest, WorkingHours, DayHours } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Helper to get start and end of a day
function getDayBounds(dateStr: string): { start: Date; end: Date } {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Helper to get week bounds (Monday to Sunday)
function getWeekBounds(dateStr: string): { start: Date; end: Date } {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday

  const start = new Date(date.setDate(diff));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Helper to get month bounds
function getMonthBounds(dateStr: string): { start: Date; end: Date } {
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// GET /api/calendar/day/:date - Get day view
router.get('/day/:date', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const dateValidation = dateSchema.safeParse(req.params.date);

    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const dateStr = dateValidation.data;
    const { start } = getDayBounds(dateStr);

    // Get appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        date: start,
      },
      include: {
        doctor: {
          select: { id: true, name: true, color: true, specialty: true },
        },
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Calculate summary
    const summary = {
      total: appointments.length,
      scheduled: appointments.filter((a) => a.status === 'SCHEDULED').length,
      confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
      checkedIn: appointments.filter((a) => a.status === 'CHECKED_IN').length,
      inProgress: appointments.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
      noShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
    };

    // Format appointments for response
    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      startTime: formatTime(apt.startTime),
      endTime: formatTime(apt.endTime),
      duration: apt.duration,
      status: apt.status,
      reason: apt.reason,
      notes: apt.notes,
      doctor: apt.doctor,
      patient: apt.patient,
      queueEntryId: apt.queueEntryId,
    }));

    res.json({
      data: {
        date: dateStr,
        appointments: formattedAppointments,
        summary,
      },
    });
  } catch (error) {
    console.error('Error fetching day view:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch day view',
    });
  }
});

// GET /api/calendar/week/:date - Get week view
router.get('/week/:date', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const dateValidation = dateSchema.safeParse(req.params.date);

    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const { start, end } = getWeekBounds(dateValidation.data);

    // Get all appointments for the week
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        date: { gte: start, lte: end },
      },
      include: {
        doctor: {
          select: { id: true, name: true, color: true },
        },
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Group appointments by day
    const days: Array<{
      date: string;
      dayName: string;
      appointments: typeof appointments;
    }> = [];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = formatDate(current);
      const dayAppointments = appointments.filter(
        (apt) => formatDate(apt.date) === dateStr
      );

      days.push({
        date: dateStr,
        dayName: dayNames[current.getDay()],
        appointments: dayAppointments.map((apt) => ({
          id: apt.id,
          startTime: formatTime(apt.startTime),
          endTime: formatTime(apt.endTime),
          duration: apt.duration,
          status: apt.status,
          reason: apt.reason,
          doctor: apt.doctor,
          patient: apt.patient,
        })),
      });

      current.setDate(current.getDate() + 1);
    }

    res.json({
      data: {
        weekStart: formatDate(start),
        weekEnd: formatDate(end),
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching week view:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch week view',
    });
  }
});

// GET /api/calendar/month/:date - Get month view
router.get('/month/:date', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const dateValidation = dateSchema.safeParse(req.params.date);

    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    const { start, end } = getMonthBounds(dateValidation.data);

    // Get appointment counts grouped by date
    const appointments = await prisma.appointment.groupBy({
      by: ['date'],
      where: {
        clinicId,
        date: { gte: start, lte: end },
        status: { notIn: ['CANCELLED'] },
      },
      _count: { id: true },
    });

    // Create a map for quick lookup
    const countMap = new Map(
      appointments.map((a) => [formatDate(a.date), a._count.id])
    );

    // Generate all days in the month
    const days: Array<{ date: string; count: number }> = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = formatDate(current);
      days.push({
        date: dateStr,
        count: countMap.get(dateStr) || 0,
      });
      current.setDate(current.getDate() + 1);
    }

    // Get month name
    const monthDate = new Date(dateValidation.data);
    const monthStr = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

    res.json({
      data: {
        month: monthStr,
        days,
      },
    });
  } catch (error) {
    console.error('Error fetching month view:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch month view',
    });
  }
});

// GET /api/calendar/slots - Get available slots for booking
router.get('/slots', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const dateValidation = dateSchema.safeParse(req.query.date);

    if (!dateValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Date is required. Use YYYY-MM-DD format.',
      });
    }

    const dateStr = dateValidation.data;
    const doctorId = req.query.doctorId as string | undefined;
    const requestedDuration = Number(req.query.duration) || 15;

    // Get doctors (optionally filtered)
    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(doctorId && { id: doctorId }),
      },
    });

    if (doctors.length === 0) {
      return res.json({
        data: {
          date: dateStr,
          slots: [],
        },
      });
    }

    // Get day of week
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()] as keyof WorkingHours;

    // Get existing appointments for all relevant doctors
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        date,
        doctorId: { in: doctors.map((d) => d.id) },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
      select: {
        doctorId: true,
        startTime: true,
        endTime: true,
      },
    });

    // Group appointments by doctor
    const appointmentsByDoctor = new Map<string, typeof existingAppointments>();
    for (const apt of existingAppointments) {
      const list = appointmentsByDoctor.get(apt.doctorId) || [];
      list.push(apt);
      appointmentsByDoctor.set(apt.doctorId, list);
    }

    // Generate available slots for each doctor
    const allSlots: Array<{
      doctorId: string;
      doctorName: string;
      start: string;
      end: string;
    }> = [];

    for (const doctor of doctors) {
      const workingHours = doctor.workingHours as WorkingHours | null;
      const dayHours = workingHours?.[dayName] as DayHours | null | undefined;

      if (!dayHours) continue;

      const duration = requestedDuration || doctor.slotDuration;
      const doctorAppointments = appointmentsByDoctor.get(doctor.id) || [];

      const workStart = parseTime(dayHours.start, date);
      const workEnd = parseTime(dayHours.end, date);

      let current = new Date(workStart);

      while (current.getTime() + duration * 60000 <= workEnd.getTime()) {
        const slotEnd = new Date(current.getTime() + duration * 60000);

        // Check if slot overlaps with any booked appointment
        const isBooked = doctorAppointments.some((apt) => {
          const aptStart = apt.startTime.getTime();
          const aptEnd = apt.endTime.getTime();
          const slotStart = current.getTime();
          const slotEndTime = slotEnd.getTime();

          return slotStart < aptEnd && slotEndTime > aptStart;
        });

        if (!isBooked) {
          allSlots.push({
            doctorId: doctor.id,
            doctorName: doctor.name,
            start: formatTime(current),
            end: formatTime(slotEnd),
          });
        }

        // Move to next slot
        current = new Date(current.getTime() + duration * 60000);
      }
    }

    // Sort slots by time, then by doctor name
    allSlots.sort((a, b) => {
      const timeCompare = a.start.localeCompare(b.start);
      if (timeCompare !== 0) return timeCompare;
      return a.doctorName.localeCompare(b.doctorName);
    });

    res.json({
      data: {
        date: dateStr,
        slots: allSlots,
      },
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch available slots',
    });
  }
});

export default router;
