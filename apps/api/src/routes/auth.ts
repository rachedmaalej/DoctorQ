import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken, authMiddleware } from '../lib/auth.js';
import { AuthRequest } from '../types/index.js';
import { ADMIN_EMAILS } from './admin.js';
import { logger } from '../lib/logger.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { registerClinicOAuth } from '../services/signupService.js';

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

    // Guard: OAuth-only account cannot use email/password login
    if (!clinic.passwordHash) {
      return res.status(400).json({
        error: {
          code: 'OAUTH_ACCOUNT',
          message: `This account uses ${clinic.oauthProvider || 'social'} login. Please sign in with ${clinic.oauthProvider || 'your social account'}.`,
          provider: clinic.oauthProvider,
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

    // Update last login timestamp (for churn tracking)
    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = signToken({
      clinicId: clinic.id,
      email: clinic.email,
      name: clinic.name,
    });

    // Generate UI labels based on business type
    const isMedical = (clinic.businessType || 'general') !== 'retail';
    const uiLabels = {
      customer: isMedical ? 'patient' : 'client',
      customers: isMedical ? 'patients' : 'clients',
      presenceOn: isMedical ? 'Docteur présent' : 'Cabinet ouvert',
      presenceOff: isMedical ? 'Docteur absent' : 'Cabinet fermé',
      addCustomer: isMedical ? 'Ajouter un patient' : 'Ajouter un client',
      noCustomers: isMedical ? 'Aucun patient dans la file' : 'Aucun client dans la file',
    };

    // Calculate subscription info
    const now = new Date();
    const endDate = clinic.subscriptionStatus === 'TRIAL' ? clinic.trialEndsAt : clinic.subscriptionEndsAt;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

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
          emailVerified: clinic.emailVerified,
          onboardingCompleted: clinic.onboardingCompleted,
          subscriptionStatus: clinic.subscriptionStatus,
          subscriptionPlan: clinic.subscriptionPlan,
          daysRemaining,
          isAdmin: ADMIN_EMAILS.includes(clinic.email.toLowerCase()),
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

    logger.error({ err: error }, "Login error");
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
        emailVerified: true,
        onboardingCompleted: true,
        onboardingStep: true,
        siret: true,
        tvaIntracomNumber: true,
        tvaRegime: true,
        postalCode: true,
        city: true,
        presetMessage1: true,
        presetMessage2: true,
        presetMessage3: true,
        presetMessage4: true,
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
    const isMedical = (clinic.businessType || 'general') !== 'retail';
    const uiLabels = {
      customer: isMedical ? 'patient' : 'client',
      customers: isMedical ? 'patients' : 'clients',
      presenceOn: isMedical ? 'Docteur présent' : 'Cabinet ouvert',
      presenceOff: isMedical ? 'Docteur absent' : 'Cabinet fermé',
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
    logger.error({ err: error }, "Get clinic error");
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to get clinic data',
      },
    });
  }
});

// POST /api/auth/change-password
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string()
    .min(10, 'Le mot de passe doit contenir au moins 10 caractères')
    .refine(pw => /[a-zA-Z]/.test(pw), 'Doit contenir au moins 1 lettre')
    .refine(pw => /\d/.test(pw), 'Doit contenir au moins 1 chiffre'),
});

router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const clinic = await prisma.clinic.findUnique({
      where: { id: req.clinic!.id },
      select: { passwordHash: true, email: true, name: true, tokenVersion: true },
    });

    if (!clinic) {
      return res.status(404).json({
        error: { code: 'CLINIC_NOT_FOUND', message: 'Clinic not found' },
      });
    }

    if (!clinic.passwordHash) {
      return res.status(400).json({
        error: { code: 'OAUTH_ACCOUNT', message: 'OAuth accounts cannot change password' },
      });
    }

    const isValid = await bcrypt.compare(currentPassword, clinic.passwordHash);
    if (!isValid) {
      return res.status(400).json({
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Increment tokenVersion to invalidate other sessions
    const updated = await prisma.clinic.update({
      where: { id: req.clinic!.id },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      },
      select: { tokenVersion: true },
    });

    // Issue a fresh JWT for the current session
    const freshToken = signToken({
      clinicId: req.clinic!.id,
      email: clinic.email,
      name: clinic.name ?? '',
    });

    logger.info({ clinicId: req.clinic!.id, newTokenVersion: updated.tokenVersion }, 'Password changed, tokenVersion incremented');

    res.json({
      data: {
        message: 'Password changed successfully',
        token: freshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, "Change password error");
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'Failed to change password' },
    });
  }
});

// POST /api/auth/oauth — Exchange Supabase token for app JWT
const oauthSchema = z.object({
  supabaseToken: z.string().min(1),
  provider: z.enum(['google', 'apple', 'facebook']),
  clinicName: z.string().min(1).optional(),
  language: z.enum(['fr', 'ar']).optional(),
});

router.post('/oauth', async (req: Request, res: Response) => {
  try {
    if (!supabaseAdmin) {
      return res.status(503).json({
        error: { code: 'SSO_UNAVAILABLE', message: 'Social login is not configured' },
      });
    }

    const { supabaseToken, provider, clinicName, language } = oauthSchema.parse(req.body);

    // Validate token with Supabase
    const { data: { user }, error: supaError } = await supabaseAdmin.auth.getUser(supabaseToken);
    if (supaError || !user?.email) {
      return res.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired social login token' },
      });
    }

    const email = user.email;

    // Find existing clinic
    const existing = await prisma.clinic.findUnique({ where: { email } });

    if (existing) {
      // Existing user — update login timestamp and link provider if not set
      await prisma.clinic.update({
        where: { id: existing.id },
        data: {
          lastLoginAt: new Date(),
          ...(existing.oauthProvider ? {} : { oauthProvider: provider }),
        },
      });

      const token = signToken({
        clinicId: existing.id,
        email: existing.email,
        name: existing.name,
      });

      // Generate UI labels
      const isMedical = (existing.businessType || 'general') !== 'retail';
      const uiLabels = {
        customer: isMedical ? 'patient' : 'client',
        customers: isMedical ? 'patients' : 'clients',
        presenceOn: isMedical ? 'Docteur présent' : 'Cabinet ouvert',
        presenceOff: isMedical ? 'Docteur absent' : 'Cabinet fermé',
        addCustomer: isMedical ? 'Ajouter un patient' : 'Ajouter un client',
        noCustomers: isMedical ? 'Aucun patient dans la file' : 'Aucun client dans la file',
      };

      const now = new Date();
      const endDate = existing.subscriptionStatus === 'TRIAL' ? existing.trialEndsAt : existing.subscriptionEndsAt;
      const daysRemaining = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      return res.json({
        data: {
          token,
          isNewUser: false,
          clinic: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            doctorName: existing.doctorName,
            language: existing.language,
            isDoctorPresent: existing.isDoctorPresent,
            businessType: existing.businessType || 'medical',
            showAppointments: existing.showAppointments !== false,
            emailVerified: existing.emailVerified,
            onboardingCompleted: existing.onboardingCompleted,
            subscriptionStatus: existing.subscriptionStatus,
            subscriptionPlan: existing.subscriptionPlan,
            daysRemaining,
            isAdmin: ADMIN_EMAILS.includes(existing.email.toLowerCase()),
            uiLabels,
          },
        },
      });
    }

    // New user — require clinic name
    if (!clinicName) {
      return res.status(400).json({
        error: { code: 'CLINIC_NAME_REQUIRED', message: 'Clinic name is required for new accounts' },
      });
    }

    const { clinicId } = await registerClinicOAuth({
      email,
      name: clinicName,
      provider,
      language,
    });

    const token = signToken({ clinicId, email, name: clinicName });

    res.json({
      data: {
        token,
        isNewUser: true,
        clinicId,
        clinicName,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error.errors },
      });
    }
    logger.error({ err: error }, 'OAuth login error');
    res.status(500).json({
      error: { code: 'SERVER_ERROR', message: 'OAuth login failed' },
    });
  }
});

export default router;
