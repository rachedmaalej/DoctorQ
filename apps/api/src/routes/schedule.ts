import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import {
  getTodaySlots,
  createSlot,
  createSlotsBatch,
  linkPatientToSlot,
  createRegulationSlots,
} from '../services/scheduleService.js';
import { logger } from '../lib/logger.js';

const router = Router();

// All routes require auth
router.use(authMiddleware);

/**
 * GET /api/clinic/schedule/today
 * Fetch today's schedule slots for the authenticated clinic
 */
router.get('/today', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const slots = await getTodaySlots(clinicId);
    res.json({ data: slots });
  } catch (err) {
    logger.error({ err }, 'Error fetching today schedule');
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to fetch schedule' } });
  }
});

/**
 * POST /api/clinic/schedule/slots
 * Create a new schedule slot
 */
const createSlotSchema = z.object({
  doctorId: z.string().min(1),
  startTime: z.string(), // ISO datetime
  endTime: z.string(),   // ISO datetime
  slotType: z.enum(['named', 'regulation', 'unplanned']).default('named'),
  patientName: z.string().optional(),
});

router.post('/slots', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const body = createSlotSchema.parse(req.body);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const slot = await createSlot({
      clinicId,
      doctorId: body.doctorId,
      date: today,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      slotType: body.slotType,
      patientName: body.patientName,
    });

    res.status(201).json({ data: slot });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({ error: { code: 'VALIDATION', message: err.errors } });
      return;
    }
    logger.error('Error creating schedule slot:', err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create slot' } });
  }
});

/**
 * POST /api/clinic/schedule/slots/:slotId/link
 * Link a queue entry to a schedule slot
 */
const linkSchema = z.object({
  queueEntryId: z.string().min(1),
});

router.post('/slots/:slotId/link', async (req: AuthRequest, res: Response) => {
  try {
    const { slotId } = req.params;
    const body = linkSchema.parse(req.body);

    const entry = await linkPatientToSlot(slotId, body.queueEntryId);
    res.json({ data: entry });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({ error: { code: 'VALIDATION', message: err.errors } });
      return;
    }
    logger.error('Error linking patient to slot:', err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to link patient' } });
  }
});

/**
 * POST /api/clinic/schedule/regulation
 * Generate regulation slots for a doctor
 */
const regulationSchema = z.object({
  doctorId: z.string().min(1),
  slotsPerHour: z.number().min(0).max(4).default(1),
  slotDurationMins: z.number().min(5).max(60).default(15),
  startHour: z.number().min(0).max(23).default(8),
  endHour: z.number().min(1).max(24).default(18),
});

router.post('/regulation', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const body = regulationSchema.parse(req.body);

    const slots = await createRegulationSlots(
      clinicId,
      body.doctorId,
      { slotsPerHour: body.slotsPerHour, slotDurationMins: body.slotDurationMins },
      { start: body.startHour, end: body.endHour },
    );

    res.status(201).json({ data: slots });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({ error: { code: 'VALIDATION', message: err.errors } });
      return;
    }
    logger.error('Error generating regulation slots:', err);
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to generate slots' } });
  }
});

/**
 * POST /api/clinic/schedule/slots/batch
 * Create multiple schedule slots at once (manual entry or ICS import)
 */
const batchCreateSchema = z.object({
  slots: z.array(z.object({
    doctorId: z.string().min(1),
    startTime: z.string(),
    endTime: z.string(),
    slotType: z.enum(['named', 'regulation', 'unplanned']).default('named'),
    patientName: z.string().optional(),
  })).min(1).max(50),
});

router.post('/slots/batch', async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic!.id;
    const body = batchCreateSchema.parse(req.body);

    const slots = await createSlotsBatch(
      clinicId,
      body.slots.map((s) => ({
        doctorId: s.doctorId,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
        slotType: s.slotType,
        patientName: s.patientName,
      })),
    );

    res.status(201).json({ data: slots });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({ error: { code: 'VALIDATION', message: err.errors } });
      return;
    }
    logger.error({ err }, 'Error batch creating slots');
    res.status(500).json({ error: { code: 'INTERNAL', message: 'Failed to create slots' } });
  }
});

export default router;
