/**
 * Doctor Routes
 * CRUD endpoints for managing doctors within a clinic
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../services/doctorService.js';
import { logger } from '../lib/logger.js';

const router = Router();

const createDoctorSchema = z.object({
  name: z.string().min(1).max(100),
  specialty: z.string().max(100).optional(),
  avgConsultationMins: z.number().min(1).max(120).optional(),
});

const updateDoctorSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  specialty: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
  avgConsultationMins: z.number().min(1).max(120).optional(),
});

// GET /api/clinic/doctors - List all doctors
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const doctors = await getDoctors(req.clinic!.id);
    res.json({ data: doctors });
  } catch (error) {
    logger.error({ err: error }, 'Get doctors error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get doctors' },
    });
  }
});

// GET /api/clinic/doctors/:id - Get single doctor
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await getDoctor(req.clinic!.id, req.params.id);
    if (!doctor) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Doctor not found' },
      });
    }
    res.json({ data: doctor });
  } catch (error) {
    logger.error({ err: error }, 'Get doctor error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to get doctor' },
    });
  }
});

// POST /api/clinic/doctors - Create doctor
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = createDoctorSchema.parse(req.body);
    const doctor = await createDoctor({
      clinicId: req.clinic!.id,
      ...data,
    });
    res.status(201).json({ data: doctor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
      });
    }
    logger.error({ err: error }, 'Create doctor error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to create doctor' },
    });
  }
});

// PATCH /api/clinic/doctors/:id - Update doctor
router.patch('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = updateDoctorSchema.parse(req.body);
    const doctor = await updateDoctor(req.clinic!.id, req.params.id, data);
    if (!doctor) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Doctor not found' },
      });
    }
    res.json({ data: doctor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
      });
    }
    logger.error({ err: error }, 'Update doctor error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update doctor' },
    });
  }
});

// DELETE /api/clinic/doctors/:id - Delete doctor
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await deleteDoctor(req.clinic!.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Doctor not found' },
      });
    }
    res.json({ data: { message: 'Doctor deleted' } });
  } catch (error) {
    logger.error({ err: error }, 'Delete doctor error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to delete doctor' },
    });
  }
});

export default router;
