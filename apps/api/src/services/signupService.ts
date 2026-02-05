/**
 * Signup Service
 * Handles self-service clinic registration, email verification,
 * and password reset functionality.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

// ─── Interfaces ──────────────────────────────────────────────

export interface SignupData {
  name: string;
  email: string;
  password: string;
  doctorName?: string;
  phone?: string;
  language?: 'fr' | 'ar';
}

export interface SignupResult {
  clinicId: string;
  email: string;
  verificationToken: string;
}

// ─── Helper Functions ────────────────────────────────────────

/**
 * Generate a secure random token for email verification or password reset
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get expiry date (24 hours from now for email verification)
 */
function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Get expiry date (1 hour from now for password reset)
 */
function getPasswordResetExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}

/**
 * Get trial end date (30 days from now)
 */
function getTrialEndDate(): Date {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 30);
  return trialEnd;
}

// ─── Signup ──────────────────────────────────────────────────

/**
 * Register a new clinic account (self-service)
 * Creates clinic with TRIAL status and sends verification email
 */
export async function registerClinic(data: SignupData): Promise<SignupResult> {
  // Check if email already exists
  const existing = await prisma.clinic.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error('A clinic with this email already exists'), {
      code: 'EMAIL_EXISTS',
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Generate verification token
  const verificationToken = generateToken();
  const verificationExpiry = getVerificationExpiry();

  // Calculate trial end date
  const trialEndsAt = getTrialEndDate();

  // Create clinic with trial subscription
  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      doctorName: data.doctorName,
      phone: data.phone,
      language: data.language ?? 'fr',
      // Subscription defaults
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
      // Email verification
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
      // Onboarding
      onboardingCompleted: false,
      onboardingStep: 0,
      // Give 50 free SMS credits to start
      smsCredits: 50,
    },
    select: {
      id: true,
      email: true,
    },
  });

  // Log subscription event
  await prisma.subscriptionEvent.create({
    data: {
      clinicId: clinic.id,
      eventType: 'trial_started',
      notes: `30-day trial started. Ends ${trialEndsAt.toISOString()}`,
    },
  });

  return {
    clinicId: clinic.id,
    email: clinic.email,
    verificationToken,
  };
}

// ─── Email Verification ──────────────────────────────────────

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<{ clinicId: string; email: string }> {
  // Find clinic with this token
  const clinic = await prisma.clinic.findUnique({
    where: { emailVerificationToken: token },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerificationExpiry: true,
    },
  });

  if (!clinic) {
    throw Object.assign(new Error('Invalid verification token'), {
      code: 'INVALID_TOKEN',
    });
  }

  if (clinic.emailVerified) {
    throw Object.assign(new Error('Email already verified'), {
      code: 'ALREADY_VERIFIED',
    });
  }

  // Check expiry
  if (clinic.emailVerificationExpiry && clinic.emailVerificationExpiry < new Date()) {
    throw Object.assign(new Error('Verification token has expired'), {
      code: 'TOKEN_EXPIRED',
    });
  }

  // Mark as verified
  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  return {
    clinicId: clinic.id,
    email: clinic.email,
  };
}

/**
 * Resend verification email (generates new token)
 */
export async function resendVerificationEmail(email: string): Promise<string> {
  const clinic = await prisma.clinic.findUnique({
    where: { email },
    select: {
      id: true,
      emailVerified: true,
    },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), {
      code: 'CLINIC_NOT_FOUND',
    });
  }

  if (clinic.emailVerified) {
    throw Object.assign(new Error('Email already verified'), {
      code: 'ALREADY_VERIFIED',
    });
  }

  // Generate new token
  const newToken = generateToken();
  const newExpiry = getVerificationExpiry();

  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      emailVerificationToken: newToken,
      emailVerificationExpiry: newExpiry,
    },
  });

  return newToken;
}

// ─── Password Reset ──────────────────────────────────────────

/**
 * Request password reset (generates reset token)
 */
export async function requestPasswordReset(email: string): Promise<string | null> {
  const clinic = await prisma.clinic.findUnique({
    where: { email },
    select: { id: true },
  });

  // Don't reveal if email exists or not (security)
  if (!clinic) {
    return null;
  }

  const resetToken = generateToken();
  const resetExpiry = getPasswordResetExpiry();

  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: resetExpiry,
    },
  });

  return resetToken;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const clinic = await prisma.clinic.findUnique({
    where: { passwordResetToken: token },
    select: {
      id: true,
      passwordResetExpiry: true,
    },
  });

  if (!clinic) {
    throw Object.assign(new Error('Invalid reset token'), {
      code: 'INVALID_TOKEN',
    });
  }

  // Check expiry
  if (clinic.passwordResetExpiry && clinic.passwordResetExpiry < new Date()) {
    throw Object.assign(new Error('Reset token has expired'), {
      code: 'TOKEN_EXPIRED',
    });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset token
  await prisma.clinic.update({
    where: { id: clinic.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });
}

// ─── Onboarding ──────────────────────────────────────────────

/**
 * Update onboarding progress
 */
export async function updateOnboardingStep(
  clinicId: string,
  step: number,
  completed: boolean = false
): Promise<void> {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      onboardingStep: step,
      onboardingCompleted: completed,
    },
  });
}

/**
 * Get onboarding status
 */
export async function getOnboardingStatus(clinicId: string): Promise<{
  step: number;
  completed: boolean;
  totalSteps: number;
}> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      onboardingStep: true,
      onboardingCompleted: true,
    },
  });

  if (!clinic) {
    throw Object.assign(new Error('Clinic not found'), {
      code: 'CLINIC_NOT_FOUND',
    });
  }

  return {
    step: clinic.onboardingStep,
    completed: clinic.onboardingCompleted,
    totalSteps: 3, // Clinic setup, QR code, First patient
  };
}
