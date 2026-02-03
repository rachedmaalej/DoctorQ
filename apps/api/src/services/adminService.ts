/**
 * Admin Service
 * Provides business metrics, clinic management, and payment tracking
 * for the SaaS command center.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';

// Tunisia is UTC+1 year-round (no DST since 2009)
const TUNISIA_OFFSET_MINUTES = 60;

/**
 * Get start of today in Tunisia timezone (Africa/Tunis, UTC+1)
 * Returns the UTC timestamp that corresponds to midnight in Tunisia
 */
function getStartOfToday(): Date {
  const now = new Date();
  // Convert current UTC time to Tunisia time
  const tunisiaTime = new Date(now.getTime() + TUNISIA_OFFSET_MINUTES * 60000);
  // Get date parts in Tunisia time
  const year = tunisiaTime.getUTCFullYear();
  const month = tunisiaTime.getUTCMonth();
  const day = tunisiaTime.getUTCDate();
  // Create midnight in Tunisia, convert back to UTC
  return new Date(Date.UTC(year, month, day) - TUNISIA_OFFSET_MINUTES * 60000);
}

/**
 * Get start of current month in Tunisia timezone
 */
function getStartOfMonth(): Date {
  const now = new Date();
  // Convert current UTC time to Tunisia time
  const tunisiaTime = new Date(now.getTime() + TUNISIA_OFFSET_MINUTES * 60000);
  // Get year/month in Tunisia time
  const year = tunisiaTime.getUTCFullYear();
  const month = tunisiaTime.getUTCMonth();
  // Create first day of month at midnight Tunisia, convert to UTC
  return new Date(Date.UTC(year, month, 1) - TUNISIA_OFFSET_MINUTES * 60000);
}

/**
 * Get date range based on period
 */
function getPeriodDateRange(period: 'today' | '7d' | '30d' | 'all'): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const now = new Date();
  const startOfToday = getStartOfToday();

  switch (period) {
    case 'today': {
      const yesterday = new Date(startOfToday);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: startOfToday,
        end: now,
        prevStart: yesterday,
        prevEnd: startOfToday,
      };
    }
    case '7d': {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(startOfToday);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      return {
        start: sevenDaysAgo,
        end: now,
        prevStart: fourteenDaysAgo,
        prevEnd: sevenDaysAgo,
      };
    }
    case '30d': {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date(startOfToday);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      return {
        start: thirtyDaysAgo,
        end: now,
        prevStart: sixtyDaysAgo,
        prevEnd: thirtyDaysAgo,
      };
    }
    case 'all':
    default:
      // For "all", compare last 30 days vs previous 30 days
      const allThirty = new Date(startOfToday);
      allThirty.setDate(allThirty.getDate() - 30);
      const allSixty = new Date(startOfToday);
      allSixty.setDate(allSixty.getDate() - 60);
      return {
        start: new Date(0), // Beginning of time
        end: now,
        prevStart: allSixty,
        prevEnd: allThirty,
      };
  }
}

/**
 * Calculate trend from current and previous values
 */
function calculateTrend(current: number, previous: number, isPositive: boolean): TrendData {
  if (previous === 0) {
    if (current === 0) {
      return { value: 0, direction: 'flat', isPositive };
    }
    return { value: 100, direction: 'up', isPositive };
  }

  const change = ((current - previous) / previous) * 100;
  const roundedChange = Math.round(change);

  if (Math.abs(roundedChange) < 1) {
    return { value: 0, direction: 'flat', isPositive };
  }

  return {
    value: roundedChange,
    direction: roundedChange > 0 ? 'up' : 'down',
    isPositive,
  };
}

// ─── Interfaces ──────────────────────────────────────────────

export interface TrendData {
  value: number;
  direction: 'up' | 'down' | 'flat';
  isPositive: boolean;
}

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

export interface ClinicRanking {
  id: string;
  name: string;
  doctorName: string | null;
  patientsThisMonth: number;
  trend: TrendData;
}

export interface ChurnRiskClinic {
  id: string;
  name: string;
  doctorName: string | null;
  daysSinceLogin: number | null;
  lastPatientCount: number;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface AdminMetricsWithTrends extends AdminMetrics {
  period: 'today' | '7d' | '30d' | 'all';
  periodLabel: string;
  trends: {
    patients: TrendData;
    qrRate: TrendData;
    atRisk: TrendData;
    collection: TrendData;
  };
  // For charts
  patientsByDay: Array<{ date: string; count: number }>;
  revenueByMonth: Array<{ month: string; collected: number; expected: number }>;
  // For performance ranking and churn risk
  clinicRankings: ClinicRanking[];
  churnRiskClinics: ChurnRiskClinic[];
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
  allTimeStats: {
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

// ─── Metrics with Trends ─────────────────────────────────────

export async function getAdminMetricsWithTrends(
  period: 'today' | '7d' | '30d' | 'all' = '30d'
): Promise<AdminMetricsWithTrends> {
  const { start, end, prevStart, prevEnd } = getPeriodDateRange(period);
  const startOfMonth = getStartOfMonth();

  // Get basic metrics
  const basicMetrics = await getAdminMetrics();

  // Current period patients
  const currentPatients = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: start, lt: end } },
  });

  // Previous period patients
  const prevPatients = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: prevStart, lt: prevEnd } },
  });

  // Current period QR check-ins
  const currentQr = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: start, lt: end }, checkInMethod: 'QR_CODE' },
  });
  const currentTotal = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: start, lt: end } },
  });
  const currentQrRate = currentTotal > 0 ? Math.round((currentQr / currentTotal) * 100) : 0;

  // Previous period QR rate
  const prevQr = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: prevStart, lt: prevEnd }, checkInMethod: 'QR_CODE' },
  });
  const prevTotal = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: prevStart, lt: prevEnd } },
  });
  const prevQrRate = prevTotal > 0 ? Math.round((prevQr / prevTotal) * 100) : 0;

  // Patients by day (last 30 days for chart)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const patientsByDayRaw = await prisma.queueEntry.groupBy({
    by: ['arrivedAt'],
    where: { arrivedAt: { gte: thirtyDaysAgo } },
    _count: { id: true },
  });

  // Aggregate by date
  const patientsByDayMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    patientsByDayMap.set(d.toISOString().split('T')[0], 0);
  }

  patientsByDayRaw.forEach((entry) => {
    const dateKey = entry.arrivedAt.toISOString().split('T')[0];
    const current = patientsByDayMap.get(dateKey) || 0;
    patientsByDayMap.set(dateKey, current + entry._count.id);
  });

  const patientsByDay = Array.from(patientsByDayMap.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  // Revenue by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const paymentsLast6Months = await prisma.paymentRecord.findMany({
    where: { month: { gte: sixMonthsAgo }, status: 'paid' },
    select: { amount: true, month: true },
  });

  const revenueByMonthMap = new Map<string, { collected: number; expected: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    d.setDate(1);
    const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
    revenueByMonthMap.set(monthKey, {
      collected: 0,
      expected: basicMetrics.totalClinics * 50000, // 50 TND in millimes
    });
  }

  paymentsLast6Months.forEach((payment) => {
    const monthKey = payment.month.toISOString().slice(0, 7);
    const current = revenueByMonthMap.get(monthKey);
    if (current) {
      current.collected += payment.amount;
    }
  });

  const revenueByMonth = Array.from(revenueByMonthMap.entries())
    .map(([month, data]) => ({
      month,
      collected: Math.round(data.collected / 1000), // Convert millimes to TND
      expected: Math.round(data.expected / 1000),
    }))
    .reverse();

  // Period labels
  const periodLabels = {
    today: "Today",
    '7d': "Last 7 days",
    '30d': "Last 30 days",
    all: "All time",
  };

  // ─── Clinic Rankings (by patients this month) ───────────────
  const prevMonthStart = new Date(startOfMonth);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);

  const clinicsWithPatients = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      doctorName: true,
      queueEntries: {
        where: { arrivedAt: { gte: startOfMonth } },
        select: { id: true },
      },
    },
  });

  // Get previous month patient counts for trends
  const clinicsWithPrevPatients = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      queueEntries: {
        where: { arrivedAt: { gte: prevMonthStart, lt: startOfMonth } },
        select: { id: true },
      },
    },
  });

  const prevPatientMap = new Map<string, number>();
  clinicsWithPrevPatients.forEach((c) => {
    prevPatientMap.set(c.id, c.queueEntries.length);
  });

  const clinicRankings: ClinicRanking[] = clinicsWithPatients
    .map((clinic) => {
      const patientsThisMonth = clinic.queueEntries.length;
      const prevMonthPatients = prevPatientMap.get(clinic.id) || 0;
      return {
        id: clinic.id,
        name: clinic.name,
        doctorName: clinic.doctorName,
        patientsThisMonth,
        trend: calculateTrend(patientsThisMonth, prevMonthPatients, true),
      };
    })
    .sort((a, b) => b.patientsThisMonth - a.patientsThisMonth)
    .slice(0, 10); // Top 10

  // ─── Churn Risk Analysis ────────────────────────────────────
  const now = new Date();
  const clinicsForChurnAnalysis = await prisma.clinic.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      doctorName: true,
      lastLoginAt: true,
      queueEntries: {
        where: { arrivedAt: { gte: startOfMonth } },
        select: { id: true },
      },
    },
  });

  const churnRiskClinics: ChurnRiskClinic[] = clinicsForChurnAnalysis
    .map((clinic) => {
      const daysSinceLogin = clinic.lastLoginAt
        ? Math.floor((now.getTime() - clinic.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let riskLevel: 'high' | 'medium' | 'low' = 'low';
      if (daysSinceLogin === null || daysSinceLogin > 7) {
        riskLevel = 'high';
      } else if (daysSinceLogin > 3 || clinic.queueEntries.length === 0) {
        riskLevel = 'medium';
      }

      return {
        id: clinic.id,
        name: clinic.name,
        doctorName: clinic.doctorName,
        daysSinceLogin,
        lastPatientCount: clinic.queueEntries.length,
        riskLevel,
      };
    })
    .filter((c) => c.riskLevel !== 'low')
    .sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });

  return {
    ...basicMetrics,
    period,
    periodLabel: periodLabels[period],
    trends: {
      patients: calculateTrend(currentPatients, prevPatients, true), // More patients is good
      qrRate: calculateTrend(currentQrRate, prevQrRate, true), // Higher QR rate is good
      atRisk: calculateTrend(basicMetrics.atRiskClinics, 0, false), // Fewer at-risk is good
      collection: calculateTrend(
        basicMetrics.totalClinics > 0 ? (basicMetrics.paidThisMonth / basicMetrics.totalClinics) * 100 : 0,
        0, // We don't have previous month data easily, show flat
        true
      ),
    },
    patientsByDay,
    revenueByMonth,
    clinicRankings,
    churnRiskClinics,
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

  // All-time stats
  const allTimeEntries = await prisma.queueEntry.findMany({
    where: { clinicId },
    select: { checkInMethod: true, arrivedAt: true, calledAt: true, status: true },
  });

  const allTimeQr = allTimeEntries.filter((e) => e.checkInMethod === 'QR_CODE').length;
  const allTimeSeen = allTimeEntries.filter(
    (e) => e.calledAt && (e.status === 'IN_CONSULTATION' || e.status === 'COMPLETED')
  );
  let allTimeAvgWait: number | null = null;
  if (allTimeSeen.length > 0) {
    const waits = allTimeSeen.map((e) =>
      Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000)
    );
    allTimeAvgWait = Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
  }

  const allTimeStats = {
    totalPatients: allTimeEntries.length,
    avgWaitMins: allTimeAvgWait,
    qrRate: allTimeEntries.length > 0
      ? Math.round((allTimeQr / allTimeEntries.length) * 100)
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
    allTimeStats,
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

export async function deleteClinic(clinicId: string) {
  // Delete in order to respect foreign key constraints
  // 1. Delete all queue entries for this clinic
  await prisma.queueEntry.deleteMany({
    where: { clinicId },
  });

  // 2. Delete all payment records for this clinic
  await prisma.paymentRecord.deleteMany({
    where: { clinicId },
  });

  // 3. Delete all daily stats for this clinic
  await prisma.dailyStat.deleteMany({
    where: { clinicId },
  });

  // 4. Finally delete the clinic itself
  const clinic = await prisma.clinic.delete({
    where: { id: clinicId },
    select: { id: true, name: true },
  });

  return clinic;
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
