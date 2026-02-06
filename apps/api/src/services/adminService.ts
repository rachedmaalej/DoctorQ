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
  // V2 subscription fields
  email: string;
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  smsCredits: number;
  onboardingStep: number;
  onboardingCompleted: boolean;
}

export interface ClinicDetail {
  clinic: {
    id: string;
    name: string;
    doctorName: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    language: string;
    avgConsultationMins: number;
    businessType: string;
    isActive: boolean;
    isDoctorPresent: boolean;
    notifyAtPosition: number;
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    smsCredits: number;
    smsCreditsUsed: number;
    onboardingStep: number;
    onboardingCompleted: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  doctors: Array<{
    id: string;
    name: string;
    specialty: string | null;
    isActive: boolean;
    avgConsultationMins: number;
  }>;
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

  // Actual MRR from subscription data
  const [monthlyActive, yearlyActive] = await Promise.all([
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionPlan: 'MONTHLY' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionPlan: 'YEARLY' } }),
  ]);
  const mrrTND = (monthlyActive * 50) + Math.round(yearlyActive * (500 / 12));
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
  // Use DailyStat for past days (archived data) + QueueEntry for today (live data)
  const startOfToday = getStartOfToday();
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Initialize all 30 days with 0
  const patientsByDayMap = new Map<string, number>();
  for (let i = 0; i < 31; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    patientsByDayMap.set(d.toISOString().split('T')[0], 0);
  }

  // Fetch archived stats from DailyStat (past days)
  const dailyStats = await prisma.dailyStat.findMany({
    where: { date: { gte: thirtyDaysAgo, lt: startOfToday } },
    select: { date: true, totalPatients: true },
  });

  dailyStats.forEach((stat) => {
    const dateKey = stat.date.toISOString().split('T')[0];
    const existing = patientsByDayMap.get(dateKey) || 0;
    patientsByDayMap.set(dateKey, existing + stat.totalPatients);
  });

  // Fetch today's live data from QueueEntry
  const todayPatientCount = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: startOfToday } },
  });
  const todayKey = new Date(startOfToday.getTime() + TUNISIA_OFFSET_MINUTES * 60000)
    .toISOString().split('T')[0];
  patientsByDayMap.set(todayKey, todayPatientCount);

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
      email: true,
      lastLoginAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      createdAt: true,
      smsCredits: true,
      onboardingStep: true,
      onboardingCompleted: true,
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

    // Exclude the last patient (latest calledAt) — receptionists often forget
    // to close the queue, distorting the last patient's timing data.
    let avgWaitMins: number | null = null;
    if (seenToday.length > 0) {
      const sorted = [...seenToday].sort(
        (a, b) => a.calledAt!.getTime() - b.calledAt!.getTime()
      );
      const forAvg = sorted.length > 1 ? sorted.slice(0, -1) : sorted;
      const waitTimes = forAvg.map((e) =>
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
      email: clinic.email,
      subscriptionStatus: clinic.subscriptionStatus,
      subscriptionPlan: clinic.subscriptionPlan,
      trialEndsAt: clinic.trialEndsAt?.toISOString() ?? null,
      createdAt: clinic.createdAt.toISOString(),
      smsCredits: clinic.smsCredits,
      onboardingStep: clinic.onboardingStep,
      onboardingCompleted: clinic.onboardingCompleted,
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
      address: true,
      language: true,
      avgConsultationMins: true,
      businessType: true,
      isActive: true,
      isDoctorPresent: true,
      notifyAtPosition: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      subscriptionEndsAt: true,
      smsCredits: true,
      smsCreditsUsed: true,
      onboardingStep: true,
      onboardingCompleted: true,
      createdAt: true,
      lastLoginAt: true,
      doctors: {
        select: { id: true, name: true, specialty: true, isActive: true, avgConsultationMins: true },
        orderBy: { createdAt: 'asc' as const },
      },
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

  // Weekly patient counts - use DailyStat for past days, QueueEntry for today
  const clinicStartOfToday = getStartOfToday();

  // Get DailyStat for past 6 days
  const weeklyDailyStats = await prisma.dailyStat.findMany({
    where: {
      clinicId,
      date: { gte: weekDates[0], lt: clinicStartOfToday },
    },
    select: { date: true, totalPatients: true },
  });

  const weeklyStatsMap = new Map<string, number>();
  weeklyDailyStats.forEach((stat) => {
    weeklyStatsMap.set(stat.date.toISOString().split('T')[0], stat.totalPatients);
  });

  // Get today's live count from QueueEntry
  const todayCount = await prisma.queueEntry.count({
    where: { clinicId, arrivedAt: { gte: clinicStartOfToday } },
  });
  const todayDateKey = new Date(clinicStartOfToday.getTime() + TUNISIA_OFFSET_MINUTES * 60000)
    .toISOString().split('T')[0];

  const weeklyPatients = weekDates.map((date) => {
    const dateKey = date.toISOString().split('T')[0];
    const count = dateKey === todayDateKey
      ? todayCount
      : (weeklyStatsMap.get(dateKey) || 0);
    return { date: dateKey, count };
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
  // Exclude last patient per day from average (unreliable timing data)
  let monthlyAvgWait: number | null = null;
  if (monthlySeen.length > 0) {
    const sorted = [...monthlySeen].sort(
      (a, b) => a.calledAt!.getTime() - b.calledAt!.getTime()
    );
    const forAvg = sorted.length > 1 ? sorted.slice(0, -1) : sorted;
    const waits = forAvg.map((e) =>
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
  // Exclude last patient from average (unreliable timing data)
  let allTimeAvgWait: number | null = null;
  if (allTimeSeen.length > 0) {
    const sorted = [...allTimeSeen].sort(
      (a, b) => a.calledAt!.getTime() - b.calledAt!.getTime()
    );
    const forAvg = sorted.length > 1 ? sorted.slice(0, -1) : sorted;
    const waits = forAvg.map((e) =>
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
      trialEndsAt: clinic.trialEndsAt?.toISOString() ?? null,
      subscriptionEndsAt: clinic.subscriptionEndsAt?.toISOString() ?? null,
    },
    doctors: clinic.doctors,
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

// ─── Update Clinic Info (Admin) ──────────────────────────────

export async function updateClinicInfo(
  clinicId: string,
  data: {
    name?: string;
    doctorName?: string;
    phone?: string;
    email?: string;
    language?: string;
    avgConsultationMins?: number;
    businessType?: string;
    address?: string;
    notifyAtPosition?: number;
  }
) {
  // If email is being changed, check uniqueness
  if (data.email) {
    const existing = await prisma.clinic.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== clinicId) {
      throw Object.assign(new Error('A clinic with this email already exists'), {
        code: 'EMAIL_EXISTS',
      });
    }
  }

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data,
    select: { id: true, name: true },
  });

  return clinic;
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

  // Admin-created clinics are pre-verified with a 30-day trial and 50 free SMS
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

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
      businessType: data.businessType ?? 'general',
      showAppointments: data.showAppointments ?? true,
      emailVerified: true,
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
      smsCredits: 50,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Log subscription event
  await prisma.subscriptionEvent.create({
    data: {
      clinicId: clinic.id,
      eventType: 'trial_started',
      notes: `Admin-created clinic. 30-day trial ends ${trialEndsAt.toISOString()}`,
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

export async function getClinicForImpersonation(clinicId: string) {
  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    select: {
      id: true,
      name: true,
      email: true,
      doctorName: true,
      language: true,
      avgConsultationMins: true,
      notifyAtPosition: true,
      isDoctorPresent: true,
      businessType: true,
      showAppointments: true,
    },
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

// ─── V2: Subscription Metrics ───────────────────────────────

export interface SubscriptionMetrics {
  activeTrials: number;
  paidSubscriptions: number;
  expiredClinics: number;
  cancelledClinics: number;
  trialConversionRate: number;
  mrrActual: number;
  dailyActiveClinics: number;
}

export async function getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
  const startOfToday = getStartOfToday();

  const [trialCount, activeCount, expiredCount, cancelledCount, totalClinics, dailyActive] =
    await Promise.all([
      prisma.clinic.count({ where: { subscriptionStatus: 'TRIAL' } }),
      prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      prisma.clinic.count({ where: { subscriptionStatus: 'EXPIRED' } }),
      prisma.clinic.count({ where: { subscriptionStatus: 'CANCELLED' } }),
      prisma.clinic.count(),
      prisma.clinic.count({ where: { lastLoginAt: { gte: startOfToday } } }),
    ]);

  // Conversion rate: clinics that ever paid / clinics that ever had a trial
  const everPaid = await prisma.subscriptionEvent.findMany({
    where: { eventType: 'payment_success' },
    select: { clinicId: true },
    distinct: ['clinicId'],
  });
  const conversionRate = totalClinics > 0
    ? Math.round((everPaid.length / totalClinics) * 100)
    : 0;

  // Actual MRR
  const [monthlyActive, yearlyActive] = await Promise.all([
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionPlan: 'MONTHLY' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionPlan: 'YEARLY' } }),
  ]);
  const mrrActual = (monthlyActive * 50) + Math.round(yearlyActive * (500 / 12));

  return {
    activeTrials: trialCount,
    paidSubscriptions: activeCount,
    expiredClinics: expiredCount,
    cancelledClinics: cancelledCount,
    trialConversionRate: conversionRate,
    mrrActual,
    dailyActiveClinics: dailyActive,
  };
}

// ─── V2: Onboarding Funnel ──────────────────────────────────

export interface OnboardingFunnel {
  steps: Array<{
    step: number;
    name: string;
    count: number;
    dropOffRate: number;
  }>;
  totalSignups: number;
  completionRate: number;
}

export async function getOnboardingFunnel(): Promise<OnboardingFunnel> {
  const totalSignups = await prisma.clinic.count();

  const [step1Plus, step2Plus, completed] = await Promise.all([
    prisma.clinic.count({ where: { onboardingStep: { gte: 1 } } }),
    prisma.clinic.count({ where: { onboardingStep: { gte: 2 } } }),
    prisma.clinic.count({ where: { onboardingCompleted: true } }),
  ]);

  const steps = [
    { step: 0, name: 'Signed Up', count: totalSignups, dropOffRate: 0 },
    {
      step: 1, name: 'Clinic Setup', count: step1Plus,
      dropOffRate: totalSignups > 0 ? Math.round(((totalSignups - step1Plus) / totalSignups) * 100) : 0,
    },
    {
      step: 2, name: 'QR Code', count: step2Plus,
      dropOffRate: step1Plus > 0 ? Math.round(((step1Plus - step2Plus) / step1Plus) * 100) : 0,
    },
    {
      step: 3, name: 'Completed', count: completed,
      dropOffRate: step2Plus > 0 ? Math.round(((step2Plus - completed) / step2Plus) * 100) : 0,
    },
  ];

  const completionRate = totalSignups > 0 ? Math.round((completed / totalSignups) * 100) : 0;

  return { steps, totalSignups, completionRate };
}

// ─── V2: Activity Feed ──────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: string;
  clinicId: string;
  clinicName: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function getRecentActivity(limit = 20): Promise<ActivityItem[]> {
  const events = await prisma.subscriptionEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      clinic: { select: { name: true } },
    },
  });

  const typeDescriptions: Record<string, (clinicName: string, amount?: number | null) => string> = {
    trial_started: (name) => `${name} started a free trial`,
    trial_expired: (name) => `${name}'s trial has expired`,
    payment_success: (name, amount) => `${name} subscribed${amount ? ` (${(amount / 1000).toFixed(0)} TND)` : ''}`,
    payment_failed: (name) => `Payment failed for ${name}`,
    payment_initiated: (name) => `${name} initiated a payment`,
    subscription_expired: (name) => `${name}'s subscription expired`,
    subscription_cancelled: (name) => `${name} cancelled their subscription`,
  };

  return events.map((event) => {
    const descFn = typeDescriptions[event.eventType] || ((name: string) => `${name}: ${event.eventType}`);
    return {
      id: event.id,
      type: event.eventType,
      clinicId: event.clinicId,
      clinicName: event.clinic.name,
      description: descFn(event.clinic.name, event.amount),
      timestamp: event.createdAt.toISOString(),
      metadata: event.amount ? { amount: event.amount, paymentRef: event.paymentRef } : undefined,
    };
  });
}

// ─── V2: Financial Analytics ────────────────────────────────

export interface FinancialAnalytics {
  mrr: number;
  mrrGrowthRate: number;
  arpu: number;
  cltv: number;
  churnRateRevenue: number;
  mrrHistory: Array<{
    month: string;
    totalMrr: number;
    newMrr: number;
    churnedMrr: number;
  }>;
  subscriptionBreakdown: {
    trial: number;
    monthlyActive: number;
    yearlyActive: number;
    pastDue: number;
    expired: number;
    cancelled: number;
  };
}

export async function getFinancialAnalytics(): Promise<FinancialAnalytics> {
  // Current subscription counts
  const [trial, monthlyActive, yearlyActive, pastDue, expired, cancelled] = await Promise.all([
    prisma.clinic.count({ where: { subscriptionStatus: 'TRIAL' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionPlan: 'MONTHLY' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', subscriptionPlan: 'YEARLY' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'PAST_DUE' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'EXPIRED' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'CANCELLED' } }),
  ]);

  const currentMrr = (monthlyActive * 50) + Math.round(yearlyActive * (500 / 12));
  const totalPaying = monthlyActive + yearlyActive;
  const arpu = totalPaying > 0 ? Math.round(currentMrr / totalPaying) : 0;

  // MRR history (last 12 months) from PaymentRecord
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await prisma.paymentRecord.findMany({
    where: { month: { gte: twelveMonthsAgo }, status: 'paid' },
    select: { amount: true, month: true },
  });

  // Subscription events for new/churned MRR
  const subEvents = await prisma.subscriptionEvent.findMany({
    where: { createdAt: { gte: twelveMonthsAgo } },
    select: { eventType: true, amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const mrrHistoryMap = new Map<string, { totalMrr: number; newMrr: number; churnedMrr: number }>();
  for (let i = 0; i < 12; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    mrrHistoryMap.set(monthKey, { totalMrr: 0, newMrr: 0, churnedMrr: 0 });
  }

  // Aggregate payments into months
  payments.forEach((p) => {
    const monthKey = p.month.toISOString().slice(0, 7);
    const entry = mrrHistoryMap.get(monthKey);
    if (entry) {
      entry.totalMrr += Math.round(p.amount / 1000);
    }
  });

  // Track new and churned from subscription events
  subEvents.forEach((event) => {
    const monthKey = event.createdAt.toISOString().slice(0, 7);
    const entry = mrrHistoryMap.get(monthKey);
    if (!entry) return;
    const amountTND = event.amount ? Math.round(event.amount / 1000) : 50;
    if (event.eventType === 'payment_success') {
      entry.newMrr += amountTND;
    } else if (event.eventType === 'subscription_expired' || event.eventType === 'subscription_cancelled' || event.eventType === 'trial_expired') {
      entry.churnedMrr += 50; // Lost potential MRR
    }
  });

  const mrrHistory = Array.from(mrrHistoryMap.entries())
    .map(([month, data]) => ({ month, ...data }))
    .reverse();

  // MRR growth rate (compare last 2 months)
  const lastMonth = mrrHistory[mrrHistory.length - 1]?.totalMrr || 0;
  const prevMonth = mrrHistory[mrrHistory.length - 2]?.totalMrr || 0;
  const mrrGrowthRate = prevMonth > 0
    ? Math.round(((lastMonth - prevMonth) / prevMonth) * 100)
    : (lastMonth > 0 ? 100 : 0);

  // Churn rate: clinics that churned this month / active clinics at start
  const thisMonthStart = getStartOfMonth();
  const churnedThisMonth = await prisma.subscriptionEvent.count({
    where: {
      createdAt: { gte: thisMonthStart },
      eventType: { in: ['subscription_expired', 'subscription_cancelled', 'trial_expired'] },
    },
  });
  const totalActive = monthlyActive + yearlyActive + trial;
  const churnRateRevenue = totalActive > 0
    ? Math.round((churnedThisMonth / totalActive) * 100)
    : 0;

  // Simple CLTV estimate: ARPU / monthly churn rate (or ARPU * 12 if no churn)
  const monthlyChurnFraction = totalActive > 0 ? churnedThisMonth / totalActive : 0;
  const cltv = monthlyChurnFraction > 0
    ? Math.round(arpu / monthlyChurnFraction)
    : arpu * 12;

  return {
    mrr: currentMrr,
    mrrGrowthRate,
    arpu,
    cltv,
    churnRateRevenue,
    mrrHistory,
    subscriptionBreakdown: { trial, monthlyActive, yearlyActive, pastDue, expired, cancelled },
  };
}

// ─── V2: Feature Adoption ───────────────────────────────────

export interface FeatureAdoption {
  checkInMethods: {
    qrCode: { count: number; percentage: number };
    manual: { count: number; percentage: number };
    whatsApp: { count: number; percentage: number };
    sms: { count: number; percentage: number };
  };
  smsUsage: {
    totalSent: number;
    clinicsUsingSms: number;
    avgPerClinic: number;
  };
  multiDoctorAdoption: number;
  avgPatientsPerClinicPerDay: number;
}

export async function getFeatureAdoption(): Promise<FeatureAdoption> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Check-in method distribution (last 30 days)
  const [qrCount, manualCount, whatsAppCount, smsCount, totalEntries] = await Promise.all([
    prisma.queueEntry.count({ where: { arrivedAt: { gte: thirtyDaysAgo }, checkInMethod: 'QR_CODE' } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: thirtyDaysAgo }, checkInMethod: 'MANUAL' } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: thirtyDaysAgo }, checkInMethod: 'WHATSAPP' } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: thirtyDaysAgo }, checkInMethod: 'SMS' } }),
    prisma.queueEntry.count({ where: { arrivedAt: { gte: thirtyDaysAgo } } }),
  ]);

  const pct = (n: number) => totalEntries > 0 ? Math.round((n / totalEntries) * 100) : 0;

  // SMS usage
  const smsAgg = await prisma.clinic.aggregate({
    _sum: { smsCreditsUsed: true },
    _count: true,
  });
  const clinicsUsingSms = await prisma.clinic.count({ where: { smsCreditsUsed: { gt: 0 } } });
  const totalSent = smsAgg._sum.smsCreditsUsed || 0;
  const totalClinics = smsAgg._count;

  // Multi-doctor adoption
  const clinicsWithDoctors = await prisma.doctor.findMany({
    where: { isActive: true },
    select: { clinicId: true },
    distinct: ['clinicId'],
  });

  // Avg patients per clinic per day (last 30 days)
  const activeClinics = await prisma.clinic.count({ where: { isActive: true } });
  const avgPatientsPerClinicPerDay = activeClinics > 0 && totalEntries > 0
    ? Math.round((totalEntries / 30 / activeClinics) * 10) / 10
    : 0;

  return {
    checkInMethods: {
      qrCode: { count: qrCount, percentage: pct(qrCount) },
      manual: { count: manualCount, percentage: pct(manualCount) },
      whatsApp: { count: whatsAppCount, percentage: pct(whatsAppCount) },
      sms: { count: smsCount, percentage: pct(smsCount) },
    },
    smsUsage: {
      totalSent,
      clinicsUsingSms,
      avgPerClinic: totalClinics > 0 ? Math.round(totalSent / totalClinics) : 0,
    },
    multiDoctorAdoption: clinicsWithDoctors.length,
    avgPatientsPerClinicPerDay,
  };
}

// ─── V2: Platform Health ────────────────────────────────────

export interface PlatformHealth {
  services: {
    api: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
    sms: 'configured' | 'not_configured';
  };
  smsStats: {
    totalCreditsIssued: number;
    totalCreditsUsed: number;
    remainingCredits: number;
  };
  clinicStats: {
    totalClinics: number;
    activeClinics: number;
    clinicsOnTrial: number;
    clinicsPaid: number;
  };
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  // Database health check
  let dbStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'down';
  }

  // SMS configuration check
  const smsConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);

  // SMS stats
  const smsAgg = await prisma.clinic.aggregate({
    _sum: { smsCredits: true, smsCreditsUsed: true },
  });

  const totalCreditsUsed = smsAgg._sum.smsCreditsUsed || 0;
  const remainingCredits = smsAgg._sum.smsCredits || 0;
  const totalCreditsIssued = totalCreditsUsed + remainingCredits;

  // Clinic breakdown
  const [totalClinics, activeClinics, clinicsOnTrial, clinicsPaid] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { isActive: true } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'TRIAL' } }),
    prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE' } }),
  ]);

  return {
    services: {
      api: 'healthy', // If we're responding, API is healthy
      database: dbStatus,
      sms: smsConfigured ? 'configured' : 'not_configured',
    },
    smsStats: { totalCreditsIssued, totalCreditsUsed, remainingCredits },
    clinicStats: { totalClinics, activeClinics, clinicsOnTrial, clinicsPaid },
  };
}

// ─── V2: Extend Trial ───────────────────────────────────────

export async function extendTrial(clinicId: string, days: number) {
  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    select: { trialEndsAt: true, subscriptionStatus: true },
  });

  const baseDate = clinic.trialEndsAt && clinic.trialEndsAt > new Date()
    ? clinic.trialEndsAt
    : new Date();
  const newTrialEnd = new Date(baseDate);
  newTrialEnd.setDate(newTrialEnd.getDate() + days);

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      trialEndsAt: newTrialEnd,
      subscriptionStatus: 'TRIAL', // Reactivate if expired
    },
    select: { id: true, name: true, trialEndsAt: true },
  });

  // Log the event
  await prisma.subscriptionEvent.create({
    data: {
      clinicId,
      eventType: 'trial_extended',
      notes: `Trial extended by ${days} days`,
    },
  });

  return updated;
}

// ─── V2: Upgrade to Active ──────────────────────────────────

export async function upgradeToActive(clinicId: string, plan: 'MONTHLY' | 'YEARLY') {
  const endDate = new Date();
  if (plan === 'MONTHLY') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: plan,
      subscriptionEndsAt: endDate,
    },
    select: { id: true, name: true, subscriptionStatus: true, subscriptionPlan: true },
  });

  await prisma.subscriptionEvent.create({
    data: {
      clinicId,
      eventType: 'subscription_activated',
      amount: plan === 'MONTHLY' ? 50000 : 500000,
      notes: `Manually upgraded to ${plan} by admin`,
    },
  });

  return updated;
}
