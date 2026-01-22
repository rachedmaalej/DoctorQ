import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken, authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';

const router = Router();

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find clinic
    const clinic = await prisma.clinic.findUnique({
      where: { email },
    });

    if (!clinic) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, clinic.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // TODO: Update last login timestamp (for churn tracking)
    // Temporarily disabled until production database is migrated with lastLoginAt field

    // Generate token
    const token = signToken({
      clinicId: clinic.id,
      email: clinic.email,
      name: clinic.name,
    });

    // Generate UI labels based on business type
    const isMedical = (clinic.businessType || 'medical') === 'medical';
    const uiLabels = {
      customer: isMedical ? 'patient' : 'client',
      customers: isMedical ? 'patients' : 'clients',
      presenceOn: isMedical ? 'Docteur présent' : 'Magasin ouvert',
      presenceOff: isMedical ? 'Docteur absent' : 'Magasin fermé',
      addCustomer: isMedical ? 'Ajouter un patient' : 'Ajouter un client',
      noCustomers: isMedical ? 'Aucun patient dans la file' : 'Aucun client dans la file',
    };

    res.json({
      data: {
        token,
        clinic: {
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          doctorName: clinic.doctorName,
          language: clinic.language,
          isDoctorPresent: clinic.isDoctorPresent,
          businessType: clinic.businessType || 'medical',
          showAppointments: clinic.showAppointments !== false,
          uiLabels,
        },
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

    console.error('Login error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Login failed',
      },
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req: AuthRequest, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  res.json({
    data: { message: 'Logged out successfully' },
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: req.clinic!.id },
      select: {
        id: true,
        name: true,
        email: true,
        doctorName: true,
        phone: true,
        address: true,
        language: true,
        avgConsultationMins: true,
        notifyAtPosition: true,
        enableWhatsApp: true,
        isDoctorPresent: true,
        businessType: true,
        showAppointments: true,
      },
    });

    if (!clinic) {
      return res.status(404).json({
        error: {
          code: 'CLINIC_NOT_FOUND',
          message: 'Clinic not found',
        },
      });
    }

    // Generate UI labels based on business type
    const isMedical = (clinic.businessType || 'medical') === 'medical';
    const uiLabels = {
      customer: isMedical ? 'patient' : 'client',
      customers: isMedical ? 'patients' : 'clients',
      presenceOn: isMedical ? 'Docteur présent' : 'Magasin ouvert',
      presenceOff: isMedical ? 'Docteur absent' : 'Magasin fermé',
      addCustomer: isMedical ? 'Ajouter un patient' : 'Ajouter un client',
      noCustomers: isMedical ? 'Aucun patient dans la file' : 'Aucun client dans la file',
    };

    res.json({
      data: {
        ...clinic,
        businessType: clinic.businessType || 'medical',
        showAppointments: clinic.showAppointments !== false,
        uiLabels,
      }
    });
  } catch (error) {
    console.error('Get clinic error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get clinic data',
      },
    });
  }
});

export default router;
