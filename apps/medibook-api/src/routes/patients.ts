import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import {
  createPatientSchema,
  updatePatientSchema,
  patientSearchSchema,
  paginationSchema,
  formatPhone,
} from '../lib/validation.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/patients - List/search patients
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const queryValidation = patientSearchSchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: queryValidation.error.flatten().fieldErrors,
      });
    }

    const { page, limit, search } = queryValidation.data;
    const skip = (page - 1) * limit;

    const where = {
      clinicId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.patient.count({ where }),
    ]);

    res.json({
      data: patients,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patients',
    });
  }
});

// GET /api/patients/:id - Get single patient
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    const patient = await prisma.patient.findFirst({
      where: { id, clinicId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Patient not found',
      });
    }

    res.json({ data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patient',
    });
  }
});

// POST /api/patients - Create patient
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const validation = createPatientSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      });
    }

    const data = validation.data;

    // Format phone number
    const phone = formatPhone(data.phone);

    // Check for duplicate phone in this clinic
    const existing = await prisma.patient.findFirst({
      where: { clinicId, phone },
    });

    if (existing) {
      return res.status(409).json({
        error: 'DUPLICATE_PATIENT',
        message: 'A patient with this phone number already exists',
        details: { existingPatientId: existing.id },
      });
    }

    const patient = await prisma.patient.create({
      data: {
        clinicId,
        ...data,
        phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    res.status(201).json({ data: patient });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to create patient',
    });
  }
});

// PATCH /api/patients/:id - Update patient
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const validation = updatePatientSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: validation.error.flatten().fieldErrors,
      });
    }

    // Check patient exists and belongs to clinic
    const existing = await prisma.patient.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Patient not found',
      });
    }

    const data = validation.data;

    // If updating phone, check for duplicates
    if (data.phone) {
      const phone = formatPhone(data.phone);
      const duplicate = await prisma.patient.findFirst({
        where: { clinicId, phone, id: { not: id } },
      });

      if (duplicate) {
        return res.status(409).json({
          error: 'DUPLICATE_PATIENT',
          message: 'A patient with this phone number already exists',
        });
      }

      data.phone = phone;
    }

    const patient = await prisma.patient.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    res.json({ data: patient });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to update patient',
    });
  }
});

// DELETE /api/patients/:id - Delete patient
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;

    // Check patient exists and belongs to clinic
    const existing = await prisma.patient.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Patient not found',
      });
    }

    // Check for future appointments
    const futureAppointments = await prisma.appointment.count({
      where: {
        patientId: id,
        date: { gte: new Date() },
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
      },
    });

    if (futureAppointments > 0) {
      return res.status(409).json({
        error: 'HAS_APPOINTMENTS',
        message: `Patient has ${futureAppointments} upcoming appointment(s). Cancel them first.`,
      });
    }

    await prisma.patient.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to delete patient',
    });
  }
});

// GET /api/patients/:id/history - Get patient's appointment history
router.get('/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const { id } = req.params;
    const queryValidation = paginationSchema.safeParse(req.query);

    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
      });
    }

    const { page, limit } = queryValidation.data;
    const skip = (page - 1) * limit;

    // Check patient exists and belongs to clinic
    const patient = await prisma.patient.findFirst({
      where: { id, clinicId },
    });

    if (!patient) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Patient not found',
      });
    }

    const where = { patientId: id };

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: {
            select: { id: true, name: true, specialty: true },
          },
        },
        orderBy: { date: 'desc' },
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
    console.error('Error fetching patient history:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch patient history',
    });
  }
});

export default router;
