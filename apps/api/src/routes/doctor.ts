/**
 * Doctor Routes
 * CRUD endpoints for managing doctors within a clinic
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { subscriptionGate } from '../lib/subscriptionGate.js';
import { AuthRequest } from '../types/index.js';
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateDoctorState,
  handleAbsence,
  transferPatient,
} from '../services/doctorService.js';
import { emitDelayNotified } from '../lib/socket.js';
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
router.post('/', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
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
router.patch('/:id', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
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
router.delete('/:id', authMiddleware, subscriptionGate, async (req: AuthRequest, res: Response) => {
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

// ─── Phase 3: Doctor State Management ───

const doctorStateSchema = z.object({
  state: z.enum(['consulting', 'free', 'pause', 'absent_today', 'home_visit', 'inactive']),
  homeVisitETA: z.string().optional(),
});

// POST /api/clinic/doctors/:id/state - Update doctor state
router.post('/:id/state', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = doctorStateSchema.parse(req.body);
    const doctor = await updateDoctorState(
      req.clinic!.id,
      req.params.id,
      data.state,
      data.homeVisitETA,
    );
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
    logger.error({ err: error }, 'Update doctor state error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to update doctor state' },
    });
  }
});

const absenceSchema = z.object({
  option: z.enum(['close', 'reassign', 'keep']),
});

// POST /api/clinic/doctors/:id/absence - Trigger absence workflow
router.post('/:id/absence', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = absenceSchema.parse(req.body);
    const result = await handleAbsence(req.clinic!.id, req.params.id, data.option);
    res.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
      });
    }
    logger.error({ err: error }, 'Doctor absence error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to handle absence' },
    });
  }
});

const transferSchema = z.object({
  targetDoctorId: z.string().min(1),
});

// POST /api/clinic/doctors/:id/transfer/:patientId - Transfer patient to another doctor
router.post('/:id/transfer/:patientId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = transferSchema.parse(req.body);
    const result = await transferPatient(req.clinic!.id, req.params.patientId, data.targetDoctorId);
    if (!result) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Patient or target doctor not found' },
      });
    }
    res.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
      });
    }
    logger.error({ err: error }, 'Transfer patient error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to transfer patient' },
    });
  }
});

const delaySchema = z.object({
  doctorId: z.string().min(1),
  delayMinutes: z.number().min(1).max(180).optional().default(15),
});

// POST /api/clinic/notify-delay - Notify patients of delay
router.post('/notify-delay', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const data = delaySchema.parse(req.body);
    emitDelayNotified(req.clinic!.id, data.doctorId, data.delayMinutes);
    res.json({ data: { notified: true, delayMinutes: data.delayMinutes } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid data', details: error.errors },
      });
    }
    logger.error({ err: error }, 'Notify delay error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to send delay notification' },
    });
  }
});

export default router;
