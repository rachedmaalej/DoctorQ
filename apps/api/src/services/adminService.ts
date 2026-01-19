/**
 * Admin Service
 * Provides business metrics and clinic health data for the admin dashboard
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';

/**
 * Get the start of today in the local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Get date X days ago
 */
function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export interface AdminMetrics {
  activeClinics: number;
  totalClinics: number;
  mrrTND: number;
  patientsToday: number;
  patientsThisWeek: number;
  avgWaitAcrossClinics: number | null;
  churnRiskCount: number;
  qrAdoptionRate: number;
}

export interface ClinicHealth {
  id: string;
  name: string;
  doctorName: string | null;
  email: string;
  lastLoginAt: Date | null;
  daysSinceLogin: number | null;
  patientsToday: number;
  avgWaitToday: number | null;
  status: 'active' | 'at_risk' | 'churned';
}

/**
 * Get admin dashboard metrics
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const startOfToday = getStartOfToday();
  const sevenDaysAgo = getDaysAgo(7);
  const thirtyDaysAgo = getDaysAgo(30);

  const [
    totalClinics,
    activeClinics,
    churnRiskClinics,
    patientsToday,
    patientsThisWeek,
    qrCheckinsToday,
    totalCheckinsToday,
    seenPatientsToday,
  ] = await Promise.all([
    // Total clinics
    prisma.clinic.count({
      where: { isActive: true },
    }),
    // Active clinics (logged in within 30 days)
    prisma.clinic.count({
      where: {
        isActive: true,
        lastLoginAt: { gte: thirtyDaysAgo },
      },
    }),
    // Churn risk (no login in 7+ days but not churned)
    prisma.clinic.count({
      where: {
        isActive: true,
        OR: [
          { lastLoginAt: { lt: sevenDaysAgo } },
          { lastLoginAt: null },
        ],
      },
    }),
    // Patients today (across all clinics)
    prisma.queueEntry.count({
      where: {
        arrivedAt: { gte: startOfToday },
      },
    }),
    // Patients this week
    prisma.queueEntry.count({
      where: {
        arrivedAt: { gte: sevenDaysAgo },
      },
    }),
    // QR check-ins today
    prisma.queueEntry.count({
      where: {
        arrivedAt: { gte: startOfToday },
        checkInMethod: 'QR_CODE',
      },
    }),
    // Total check-ins today (for QR adoption rate)
    prisma.queueEntry.count({
      where: {
        arrivedAt: { gte: startOfToday },
      },
    }),
    // Seen patients today (for avg wait calculation)
    prisma.queueEntry.findMany({
      where: {
        arrivedAt: { gte: startOfToday },
        status: { in: [QueueStatus.IN_CONSULTATION, QueueStatus.COMPLETED] },
        calledAt: { not: null },
      },
      select: { arrivedAt: true, calledAt: true },
    }),
  ]);

  // Calculate average wait time across all clinics
  let avgWaitAcrossClinics: number | null = null;
  if (seenPatientsToday.length > 0) {
    const waitTimes = seenPatientsToday.map((p) =>
      Math.round((p.calledAt!.getTime() - p.arrivedAt.getTime()) / 60000)
    );
    avgWaitAcrossClinics = Math.round(
      waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
    );
  }

  // Calculate QR adoption rate
  const qrAdoptionRate = totalCheckinsToday > 0
    ? Math.round((qrCheckinsToday / totalCheckinsToday) * 100)
    : 0;

  // MRR: 50 TND per active clinic
  const mrrTND = activeClinics * 50;

  return {
    activeClinics,
    totalClinics,
    mrrTND,
    patientsToday,
    patientsThisWeek,
    avgWaitAcrossClinics,
    churnRiskCount: churnRiskClinics,
    qrAdoptionRate,
  };
}

/**
 * Get clinic health list for admin dashboard
 */
export async function getClinicHealthList(): Promise<ClinicHealth[]> {
  const startOfToday = getStartOfToday();
  const sevenDaysAgo = getDaysAgo(7);
  const thirtyDaysAgo = getDaysAgo(30);

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      doctorName: true,
      email: true,
      lastLoginAt: true,
      queueEntries: {
        where: {
          arrivedAt: { gte: startOfToday },
        },
        select: {
          arrivedAt: true,
          calledAt: true,
          status: true,
        },
      },
    },
    orderBy: { lastLoginAt: 'desc' },
  });

  return clinics.map((clinic) => {
    // Calculate days since last login
    let daysSinceLogin: number | null = null;
    if (clinic.lastLoginAt) {
      daysSinceLogin = Math.floor(
        (Date.now() - clinic.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    // Determine health status
    let status: 'active' | 'at_risk' | 'churned' = 'active';
    if (!clinic.lastLoginAt || clinic.lastLoginAt < thirtyDaysAgo) {
      status = 'churned';
    } else if (clinic.lastLoginAt < sevenDaysAgo) {
      status = 'at_risk';
    }

    // Calculate today's stats
    const patientsToday = clinic.queueEntries.length;
    const seenToday = clinic.queueEntries.filter(
      (e) => e.calledAt && (e.status === 'IN_CONSULTATION' || e.status === 'COMPLETED')
    );

    let avgWaitToday: number | null = null;
    if (seenToday.length > 0) {
      const waitTimes = seenToday.map((e) =>
        Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000)
      );
      avgWaitToday = Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length);
    }

    return {
      id: clinic.id,
      name: clinic.name,
      doctorName: clinic.doctorName,
      email: clinic.email,
      lastLoginAt: clinic.lastLoginAt,
      daysSinceLogin,
      patientsToday,
      avgWaitToday,
      status,
    };
  });
}

/**
 * Update clinic's last login timestamp
 * Call this on every successful login
 */
export async function updateLastLogin(clinicId: string): Promise<void> {
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { lastLoginAt: new Date() },
  });
}
