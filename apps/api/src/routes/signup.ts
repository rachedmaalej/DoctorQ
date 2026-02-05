/**
 * Signup Routes
 * Public endpoints for self-service clinic registration
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  registerClinic,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPassword,
} from '../services/signupService.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from '../lib/email.js';
import { prisma } from '../lib/prisma.js';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const signupSchema = z.object({
  name: z.string().min(2, 'Clinic name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  doctorName: z.string().optional(),
  phone: z.string().optional(),
  language: z.enum(['fr', 'ar']).optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ─── Routes ──────────────────────────────────────────────────

/**
 * POST /api/signup
 * Register a new clinic (self-service)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);

    const result = await registerClinic(data);

    // Send verification email
    await sendVerificationEmail(
      result.email,
      data.name,
      result.verificationToken,
      data.language || 'fr'
    );

    res.status(201).json({
      data: {
        message: 'Account created successfully. Please check your email to verify your account.',
        clinicId: result.clinicId,
        email: result.email,
        // Remove this in production - only for development
        ...(process.env.NODE_ENV === 'development' && {
          _devOnly: { verificationToken: result.verificationToken },
        }),
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

    if ((error as { code?: string }).code === 'EMAIL_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_EXISTS',
          message: 'A clinic with this email already exists',
        },
      });
    }

    console.error('Signup error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Registration failed',
      },
    });
  }
});

/**
 * POST /api/signup/verify-email
 * Verify email address with token
 */
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = verifyEmailSchema.parse(req.body);

    const result = await verifyEmail(token);

    // Get clinic details for welcome email
    const clinic = await prisma.clinic.findUnique({
      where: { id: result.clinicId },
      select: { name: true, language: true },
    });

    // Send welcome email
    if (clinic) {
      await sendWelcomeEmail(
        result.email,
        clinic.name,
        (clinic.language as 'fr' | 'ar') || 'fr'
      );
    }

    res.json({
      data: {
        message: 'Email verified successfully. You can now log in.',
        email: result.email,
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

    const code = (error as { code?: string }).code;
    if (code === 'INVALID_TOKEN') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid verification token',
        },
      });
    }

    if (code === 'ALREADY_VERIFIED') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email already verified',
        },
      });
    }

    if (code === 'TOKEN_EXPIRED') {
      return res.status(400).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Verification token has expired. Please request a new one.',
        },
      });
    }

    console.error('Email verification error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Email verification failed',
      },
    });
  }
});

/**
 * POST /api/signup/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = resendVerificationSchema.parse(req.body);

    const newToken = await resendVerificationEmail(email);

    // Get clinic details for email
    const clinic = await prisma.clinic.findUnique({
      where: { email },
      select: { name: true, language: true },
    });

    // Send verification email
    if (clinic) {
      await sendVerificationEmail(
        email,
        clinic.name,
        newToken,
        (clinic.language as 'fr' | 'ar') || 'fr'
      );
    }

    res.json({
      data: {
        message: 'Verification email sent. Please check your inbox.',
        // Remove this in production - only for development
        ...(process.env.NODE_ENV === 'development' && {
          _devOnly: { verificationToken: newToken },
        }),
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

    const code = (error as { code?: string }).code;
    if (code === 'CLINIC_NOT_FOUND') {
      // Don't reveal if email exists - security
      return res.json({
        data: {
          message: 'If an account exists with this email, a verification link will be sent.',
        },
      });
    }

    if (code === 'ALREADY_VERIFIED') {
      return res.status(400).json({
        error: {
          code: 'ALREADY_VERIFIED',
          message: 'Email already verified. You can log in.',
        },
      });
    }

    console.error('Resend verification error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to resend verification email',
      },
    });
  }
});

/**
 * POST /api/signup/forgot-password
 * Request password reset
 */
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const resetToken = await requestPasswordReset(email);

    // Send password reset email if token was generated (clinic exists)
    if (resetToken) {
      const clinic = await prisma.clinic.findUnique({
        where: { email },
        select: { name: true, language: true },
      });

      if (clinic) {
        await sendPasswordResetEmail(
          email,
          clinic.name,
          resetToken,
          (clinic.language as 'fr' | 'ar') || 'fr'
        );
      }
    }

    // Always return success to not reveal if email exists
    res.json({
      data: {
        message: 'If an account exists with this email, a password reset link will be sent.',
        // Remove this in production - only for development
        ...(process.env.NODE_ENV === 'development' && resetToken && {
          _devOnly: { resetToken },
        }),
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

    console.error('Forgot password error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to process password reset request',
      },
    });
  }
});

/**
 * POST /api/signup/reset-password
 * Reset password with token
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    await resetPassword(token, password);

    res.json({
      data: {
        message: 'Password reset successfully. You can now log in with your new password.',
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

    const code = (error as { code?: string }).code;
    if (code === 'INVALID_TOKEN') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
        },
      });
    }

    if (code === 'TOKEN_EXPIRED') {
      return res.status(400).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Reset token has expired. Please request a new one.',
        },
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to reset password',
      },
    });
  }
});

export default router;
