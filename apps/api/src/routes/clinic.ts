import { Router, Response } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// GET /api/clinic - Get clinic details
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        doctorName: true,
        phone: true,
        address: true,
        language: true,
        avgConsultationMins: true,
        notifyAtPosition: true,
        enableWhatsApp: true,
        email: true,
        isActive: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    res.json(clinic);
  } catch (error: any) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: 'Failed to fetch clinic details' });
  }
});

// PATCH /api/clinic - Update clinic settings
const updateClinicSchema = z.object({
  name: z.string().optional(),
  doctorName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  language: z.enum(['fr', 'ar']).optional(),
  avgConsultationMins: z.number().int().min(5).max(120).optional(),
  notifyAtPosition: z.number().int().min(1).max(10).optional(),
  enableWhatsApp: z.boolean().optional(),
});

router.patch('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = updateClinicSchema.parse(req.body);

    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data,
      select: {
        id: true,
        name: true,
        doctorName: true,
        phone: true,
        address: true,
        language: true,
        avgConsultationMins: true,
        notifyAtPosition: true,
        enableWhatsApp: true,
      },
    });

    res.json(updatedClinic);
  } catch (error: any) {
    console.error('Error updating clinic:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Failed to update clinic settings' });
  }
});

// GET /api/clinic/:clinicId/info - Public endpoint for clinic info (for check-in page)
router.get('/:clinicId/info', async (req, res: Response) => {
  try {
    const { clinicId } = req.params;

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        name: true,
        avgConsultationMins: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      });
    }

    // Count waiting patients
    const waitingCount = await prisma.queueEntry.count({
      where: {
        clinicId,
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
    });

    res.json({
      data: {
        name: clinic.name,
        waitingCount,
        avgConsultationMins: clinic.avgConsultationMins,
      },
    });
  } catch (error: any) {
    console.error('Error fetching clinic info:', error);
    res.status(500).json({ error: 'Failed to fetch clinic info' });
  }
});

// GET /api/clinic/qr - Generate QR code for check-in
router.get('/qr', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinicId = req.clinic?.id;
    if (!clinicId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, name: true },
    });

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    // Generate check-in URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const checkInUrl = `${frontendUrl}/checkin/${clinicId}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 400,
      margin: 2,
    });

    res.json({
      data: {
        url: checkInUrl,
        qrCode: qrCodeDataUrl,
        clinicName: clinic.name,
      },
    });
  } catch (error: any) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

export default router;
