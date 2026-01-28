/**
 * Admin Service
 * Provides business metrics, clinic management, and payment tracking
 * for the SaaS command center.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

function getStartOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function getStartOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ─── Interfaces ──────────────────────────────────────────────

export interface AdminMetrics {
  activeClinics: number;
  totalClinics: number;
  mrrTND: number;
  patientsToday: number;
  qrCheckinRate: number;
  atRiskClinics: number;
  paidThisMonth: number;
  overdueCount: number;
}

export interface ClinicHealth {
  id: string;
  name: string;
  doctorName: string | null;
  lastLoginAt: string | null;
  patientsToday: number;
  avgWaitMins: number | null;
  status: 'active' | 'at_risk' | 'churned';
  paymentStatus: 'paid' | 'overdue' | 'none';
}

export interface ClinicDetail {
  clinic: {
    id: string;
    name: string;
    doctorName: string | null;
    email: string;
    phone: string | null;
    language: string;
    avgConsultationMins: number;
    businessType: string;
    isActive: boolean;
    isDoctorPresent: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  todayStats: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
  };
  weeklyPatients: Array<{ date: string; count: number }>;
  monthlyStats: {
    totalPatients: number;
    avgWaitMins: number | null;
    qrRate: number;
  };
  recentEntries: Array<{
    id: string;
    patientName: string | null;
    patientPhone: string;
    status: string;
    checkInMethod: string;
    arrivedAt: string;
    calledAt: string | null;
    completedAt: string | null;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    month: string;
    method: string;
    reference: string | null;
    status: string;
    paidAt: string;
  }>;
}

export interface CreateClinicData {
  name: string;
  email: string;
  password: string;
  doctorName?: string;
  phone?: string;
  address?: string;
  language?: string;
  avgConsultationMins?: number;
  businessType?: string;
  showAppointments?: boolean;
}

export interface RecordPaymentData {
  amount: number; // in millimes
  month: string; // ISO date string (first of month)
  method: string;
  reference?: string;
  notes?: string;
  recordedBy: string;
}

// ─── Metrics ─────────────────────────────────────────────────

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const startOfToday = getStartOfToday();
  const startOfMonth = getStartOfMonth();

  const [
    totalClinics,
    patientsToday,
    qrCheckinsToday,
    totalCheckinsToday,
    paidThisMonth,
  ] = await Promise.all([
    prisma.clinic.count({ where: { isActive: true } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: startOfToday } } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: startOfToday }, checkInMethod: 'QR_CODE' } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: startOfToday } } }),
    prisma.paymentRecord.count({
      where: { month: startOfMonth, status: 'paid' },
    }),
  ]);

  // Activity tracking: clinics with no login in 7+ days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const atRiskClinics = await prisma.clinic.count({
    where: {
      isActive: true,
      OR: [
        { lastLoginAt: null },
        { lastLoginAt: { lt: sevenDaysAgo } },
      ],
    },
  });

  const activeClinics = totalClinics;
  const qrCheckinRate = totalCheckinsToday > 0
    ? Math.round((qrCheckinsToday / totalCheckinsToday) * 100)
    : 0;
  const mrrTND = activeClinics * 50;
  const overdueCount = totalClinics - paidThisMonth;

  return {
    activeClinics,
    totalClinics,
    mrrTND,
    patientsToday,
    qrCheckinRate,
    atRiskClinics,
    paidThisMonth,
    overdueCount: Math.max(0, overdueCount),
  };
}

// ─── Clinic Health List ──────────────────────────────────────

export async function getClinicHealthList(): Promise<ClinicHealth[]> {
  const startOfToday = getStartOfToday();
  const startOfMonth = getStartOfMonth();

  const clinics = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      doctorName: true,
      lastLoginAt: true,
      queueEntries: {
        where: { arrivedAt: { gte: startOfToday } },
        select: { arrivedAt: true, calledAt: true, status: true },
      },
      paymentRecords: {
        where: { month: startOfMonth, status: 'paid' },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  return clinics.map((clinic) => {
    // Determine activity status
    let status: 'active' | 'at_risk' | 'churned' = 'active';
    if (clinic.lastLoginAt) {
      if (clinic.lastLoginAt < sevenDaysAgo) {
        status = 'at_risk';
      }
    }

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

    const paymentStatus: 'paid' | 'overdue' | 'none' =
      clinic.paymentRecords.length > 0 ? 'paid' : 'overdue';

    return {
      id: clinic.id,
      name: clinic.name,
      doctorName: clinic.doctorName,
      lastLoginAt: clinic.lastLoginAt?.toISOString() ?? null,
      patientsToday,
      avgWaitMins,
      status,
      paymentStatus,
    };
  });
}

// ─── Clinic Detail ───────────────────────────────────────────

export async function getClinicDetails(clinicId: string): Promise<ClinicDetail> {
  const startOfToday = getStartOfToday();
  const startOfMonth = getStartOfMonth();

  // Build dates for last 7 days
  const weekDates: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    weekDates.push(d);
  }

  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      doctorName: true,
      email: true,
      phone: true,
      language: true,
      avgConsultationMins: true,
      businessType: true,
      isActive: true,
      isDoctorPresent: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  // Today's entries by status
  const todayEntries = await prisma.queueEntry.findMany({
    where: { clinicId, arrivedAt: { gte: startOfToday } },
    select: { status: true },
  });

  const todayStats = {
    waiting: todayEntries.filter((e) => e.status === 'WAITING' || e.status === 'NOTIFIED').length,
    inConsultation: todayEntries.filter((e) => e.status === 'IN_CONSULTATION').length,
    completed: todayEntries.filter((e) => e.status === 'COMPLETED').length,
    noShows: todayEntries.filter((e) => e.status === 'NO_SHOW').length,
    cancelled: todayEntries.filter((e) => e.status === 'CANCELLED').length,
  };

  // Weekly patient counts
  const weeklyEntries = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      arrivedAt: { gte: weekDates[0] },
    },
    select: { arrivedAt: true },
  });

  const weeklyPatients = weekDates.map((date) => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const count = weeklyEntries.filter(
      (e) => e.arrivedAt >= date && e.arrivedAt < nextDay
    ).length;
    return { date: date.toISOString().split('T')[0], count };
  });

  // Monthly stats
  const monthlyEntries = await prisma.queueEntry.findMany({
    where: { clinicId, arrivedAt: { gte: startOfMonth } },
    select: { checkInMethod: true, arrivedAt: true, calledAt: true, status: true },
  });

  const monthlyQr = monthlyEntries.filter((e) => e.checkInMethod === 'QR_CODE').length;
  const monthlySeen = monthlyEntries.filter(
    (e) => e.calledAt && (e.status === 'IN_CONSULTATION' || e.status === 'COMPLETED')
  );
  let monthlyAvgWait: number | null = null;
  if (monthlySeen.length > 0) {
    const waits = monthlySeen.map((e) =>
      Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000)
    );
    monthlyAvgWait = Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
  }

  const monthlyStats = {
    totalPatients: monthlyEntries.length,
    avgWaitMins: monthlyAvgWait,
    qrRate: monthlyEntries.length > 0
      ? Math.round((monthlyQr / monthlyEntries.length) * 100)
      : 0,
  };

  // Recent queue entries
  const recentEntries = await prisma.queueEntry.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      patientName: true,
      patientPhone: true,
      status: true,
      checkInMethod: true,
      arrivedAt: true,
      calledAt: true,
      completedAt: true,
    },
  });

  // Payment history
  const payments = await prisma.paymentRecord.findMany({
    where: { clinicId },
    orderBy: { month: 'desc' },
    select: {
      id: true,
      amount: true,
      month: true,
      method: true,
      reference: true,
      status: true,
      paidAt: true,
    },
  });

  return {
    clinic: {
      ...clinic,
      createdAt: clinic.createdAt.toISOString(),
      lastLoginAt: clinic.lastLoginAt?.toISOString() ?? null,
    },
    todayStats,
    weeklyPatients,
    monthlyStats,
    recentEntries: recentEntries.map((e) => ({
      ...e,
      arrivedAt: e.arrivedAt.toISOString(),
      calledAt: e.calledAt?.toISOString() ?? null,
      completedAt: e.completedAt?.toISOString() ?? null,
    })),
    payments: payments.map((p) => ({
      ...p,
      month: p.month.toISOString(),
      paidAt: p.paidAt.toISOString(),
    })),
  };
}

// ─── Clinic CRUD ─────────────────────────────────────────────

export async function createClinic(data: CreateClinicData) {
  const existing = await prisma.clinic.findUnique({ where: { email: data.email } });
  if (existing) {
    throw Object.assign(new Error('A clinic with this email already exists'), {
      code: 'EMAIL_EXISTS',
    });
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const clinic = await prisma.clinic.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      doctorName: data.doctorName,
      phone: data.phone,
      address: data.address,
      language: data.language ?? 'fr',
      avgConsultationMins: data.avgConsultationMins ?? 10,
      businessType: data.businessType ?? 'medical',
      showAppointments: data.showAppointments ?? true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  return clinic;
}

export async function updateClinicStatus(clinicId: string, isActive: boolean) {
  return prisma.clinic.update({
    where: { id: clinicId },
    data: { isActive },
    select: { id: true, name: true, isActive: true },
  });
}

export async function resetClinicPassword(clinicId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  return prisma.clinic.update({
    where: { id: clinicId },
    data: { passwordHash },
    select: { id: true, name: true },
  });
}

// ─── Payment Tracking ────────────────────────────────────────

export async function recordPayment(clinicId: string, data: RecordPaymentData) {
  return prisma.paymentRecord.upsert({
    where: {
      clinicId_month: {
        clinicId,
        month: new Date(data.month),
      },
    },
    create: {
      clinicId,
      amount: data.amount,
      month: new Date(data.month),
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      status: 'paid',
      recordedBy: data.recordedBy,
    },
    update: {
      amount: data.amount,
      method: data.method,
      reference: data.reference,
      notes: data.notes,
      status: 'paid',
      recordedBy: data.recordedBy,
      paidAt: new Date(),
    },
  });
}

export async function getClinicPayments(clinicId: string) {
  return prisma.paymentRecord.findMany({
    where: { clinicId },
    orderBy: { month: 'desc' },
  });
}

export async function updatePaymentStatus(paymentId: string, status: string) {
  return prisma.paymentRecord.update({
    where: { id: paymentId },
    data: { status },
  });
}
