/**
 * Admin Service
 * Provides business metrics and clinic health data for the admin dashboard
 *
 * Note: Activity tracking (lastLoginAt) is temporarily disabled until
 * the production database is migrated.
 */

import { prisma } from '../lib/prisma.js';

/**
 * Get the start of today in the local timezone
 */
function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export interface AdminMetrics {
  activeClinics: number;
  totalClinics: number;
  mrrTND: number;
  patientsToday: number;
  qrCheckinRate: number;
  atRiskClinics: number;
}

export interface ClinicHealth {
  id: string;
  name: string;
  doctorName: string | null;
  lastLoginAt: string | null;
  patientsToday: number;
  avgWaitMins: number | null;
  status: 'active' | 'at_risk' | 'churned';
}

/**
 * Get admin dashboard metrics
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  const startOfToday = getStartOfToday();

  const [
    totalClinics,
    patientsToday,
    qrCheckinsToday,
    totalCheckinsToday,
  ] = await Promise.all([
    // Total clinics
    prisma.clinic.count({
      where: { isActive: true },
    }),
    // Patients today (across all clinics)
    prisma.queueEntry.count({
      where: {
        arrivedAt: { gte: startOfToday },
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
  ]);

  // Without lastLoginAt, all clinics are considered "active"
  // TODO: Re-enable activity tracking after migration
  const activeClinics = totalClinics;
  const atRiskClinics = 0;

  // Calculate QR adoption rate
  const qrCheckinRate = totalCheckinsToday > 0
    ? Math.round((qrCheckinsToday / totalCheckinsToday) * 100)
    : 0;

  // MRR: 50 TND per active clinic
  const mrrTND = activeClinics * 50;

  return {
    activeClinics,
    totalClinics,
    mrrTND,
    patientsToday,
    qrCheckinRate,
    atRiskClinics,
  };
}

/**
 * Get clinic health list for admin dashboard
 */
export async function getClinicHealthList(): Promise<ClinicHealth[]> {
  const startOfToday = getStartOfToday();

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      doctorName: true,
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
    orderBy: { name: 'asc' },
  });

  return clinics.map((clinic) => {
    // Without lastLoginAt, all clinics show as "active"
    // TODO: Re-enable activity tracking after migration
    const status: 'active' | 'at_risk' | 'churned' = 'active';

    // Calculate today's stats
    const patientsToday = clinic.queueEntries.length;
    const seenToday = clinic.queueEntries.filter(
      (e) => e.calledAt && (e.status === 'IN_CONSULTATION' || e.status === 'COMPLETED')
    );

    let avgWaitMins: number | null = null;
    if (seenToday.length > 0) {
      const waitTimes = seenToday.map((e) =>
        Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000)
      );
      avgWaitMins = Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length);
    }

    return {
      id: clinic.id,
      name: clinic.name,
      doctorName: clinic.doctorName,
      lastLoginAt: null, // TODO: Re-enable after migration
      patientsToday,
      avgWaitMins,
      status,
    };
  });
}
