/**
 * Admin Service
 * Provides business metrics, clinic management, and payment tracking
 * for the SaaS command center.
 */

import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { getStartOfToday, getStartOfMonth, getTimezoneOffsetMinutes } from '../lib/timezone.js';
import { brand, formatPrice } from '../lib/brand.js';

// Country filter constants for brand-level data isolation
const countryFilter = { country: brand.country };
const clinicCountryFilter = { clinic: { country: brand.country } };

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
  isActive: boolean;
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

  // Sequential queries to prevent pgbouncer pool exhaustion
  const totalClinics = await prisma.clinic.count({ where: { isActive: true, ...countryFilter } });
  const patientsToday = await prisma.queueEntry.count({ where: { arrivedAt: { gte: startOfToday }, ...clinicCountryFilter } });
  const qrCheckinsToday = await prisma.queueEntry.count({ where: { arrivedAt: { gte: startOfToday }, checkInMethod: 'QR_CODE', ...clinicCountryFilter } });
  const totalCheckinsToday = patientsToday; // Same query, reuse result
  const paidThisMonth = await prisma.paymentRecord.count({
    where: { month: startOfMonth, status: 'paid', ...clinicCountryFilter },
  });

  // Activity tracking: clinics with no login in 7+ days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const atRiskClinics = await prisma.clinic.count({
    where: {
      isActive: true,
      ...countryFilter,
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

  // MRR from subscription data — use groupBy to avoid parallel queries
  const planGroups = await prisma.clinic.groupBy({
    by: ['subscriptionPlan'],
    where: { subscriptionStatus: 'ACTIVE', ...countryFilter },
    _count: true,
  });
  const planMap: Record<string, number> = {};
  for (const g of planGroups) { planMap[g.subscriptionPlan || ''] = g._count; }
  const monthlyMajor = brand.pricing.monthly / brand.currency.multiplier;
  const yearlyMajor = brand.pricing.yearly / brand.currency.multiplier;
  const mrrTND = ((planMap['MONTHLY'] || 0) * monthlyMajor) + Math.round((planMap['YEARLY'] || 0) * (yearlyMajor / 12));
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
    where: { arrivedAt: { gte: start, lt: end }, ...clinicCountryFilter },
  });

  // Previous period patients
  const prevPatients = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: prevStart, lt: prevEnd }, ...clinicCountryFilter },
  });

  // Current period QR check-ins
  const currentQr = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: start, lt: end }, checkInMethod: 'QR_CODE', ...clinicCountryFilter },
  });
  const currentTotal = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: start, lt: end }, ...clinicCountryFilter },
  });
  const currentQrRate = currentTotal > 0 ? Math.round((currentQr / currentTotal) * 100) : 0;

  // Previous period QR rate
  const prevQr = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: prevStart, lt: prevEnd }, checkInMethod: 'QR_CODE', ...clinicCountryFilter },
  });
  const prevTotal = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: prevStart, lt: prevEnd }, ...clinicCountryFilter },
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
    where: { date: { gte: thirtyDaysAgo, lt: startOfToday }, ...clinicCountryFilter },
    select: { date: true, totalPatients: true },
  });

  dailyStats.forEach((stat) => {
    const dateKey = stat.date.toISOString().split('T')[0];
    const existing = patientsByDayMap.get(dateKey) || 0;
    patientsByDayMap.set(dateKey, existing + stat.totalPatients);
  });

  // Fetch today's live data from QueueEntry
  const todayPatientCount = await prisma.queueEntry.count({
    where: { arrivedAt: { gte: startOfToday }, ...clinicCountryFilter },
  });
  const todayKey = new Date(startOfToday.getTime() + getTimezoneOffsetMinutes() * 60000)
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
    where: { month: { gte: sixMonthsAgo }, status: 'paid', ...clinicCountryFilter },
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
      expected: basicMetrics.totalClinics * brand.pricing.monthly,
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
      collected: Math.round(data.collected / brand.currency.multiplier),
      expected: Math.round(data.expected / brand.currency.multiplier),
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
    where: { isActive: true, ...countryFilter },
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
    where: { isActive: true, ...countryFilter },
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
    where: { isActive: true, ...countryFilter },
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
    where: { ...countryFilter },
    select: {
      id: true,
      name: true,
      doctorName: true,
      email: true,
      isActive: true,
      lastLoginAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      createdAt: true,
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
      isActive: clinic.isActive,
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
  const todayDateKey = new Date(clinicStartOfToday.getTime() + getTimezoneOffsetMinutes() * 60000)
    .toISOString().split('T')[0];

  const weeklyPatients = weekDates.map((date) => {
    const dateKey = date.toISOString().split('T')[0];
    const count = dateKey === todayDateKey
      ? todayCount
      : (weeklyStatsMap.get(dateKey) || 0);
    return { date: dateKey, count };
  });

  // Monthly stats (from DailyStat, plus today's live QueueEntry)
  const monthlyDailyStats = await prisma.dailyStat.findMany({
    where: { clinicId, date: { gte: startOfMonth } },
    select: { totalPatients: true, totalWaitMins: true, patientsWithWait: true, checkInQr: true },
  });
  const monthlyTotalFromStats = monthlyDailyStats.reduce((s, d) => s + d.totalPatients, 0);
  const monthlyQrFromStats = monthlyDailyStats.reduce((s, d) => s + d.checkInQr, 0);
  const monthlyWaitSum = monthlyDailyStats.reduce((s, d) => s + d.totalWaitMins, 0);
  const monthlyWaitCount = monthlyDailyStats.reduce((s, d) => s + d.patientsWithWait, 0);
  // Add today's live count
  const todayMonthlyCount = await prisma.queueEntry.count({ where: { clinicId, arrivedAt: { gte: startOfToday } } });
  const monthlyTotal = monthlyTotalFromStats + todayMonthlyCount;
  const monthlyAvgWait = monthlyWaitCount > 0 ? Math.round(monthlyWaitSum / monthlyWaitCount) : null;

  const monthlyStats = {
    totalPatients: monthlyTotal,
    avgWaitMins: monthlyAvgWait,
    qrRate: monthlyTotal > 0
      ? Math.round((monthlyQrFromStats / monthlyTotal) * 100)
      : 0,
  };

  // All-time stats (from DailyStat aggregates — no full QueueEntry scan)
  const allTimeAgg = await prisma.dailyStat.aggregate({
    where: { clinicId },
    _sum: { totalPatients: true, totalWaitMins: true, patientsWithWait: true, checkInQr: true },
  });
  const allTimeTotal = (allTimeAgg._sum.totalPatients || 0) + todayMonthlyCount;
  const allTimeWaitSum = allTimeAgg._sum.totalWaitMins || 0;
  const allTimeWaitCount = allTimeAgg._sum.patientsWithWait || 0;
  const allTimeQr = allTimeAgg._sum.checkInQr || 0;

  const allTimeStats = {
    totalPatients: allTimeTotal,
    avgWaitMins: allTimeWaitCount > 0 ? Math.round(allTimeWaitSum / allTimeWaitCount) : null,
    qrRate: allTimeTotal > 0
      ? Math.round((allTimeQr / allTimeTotal) * 100)
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

  // Admin-created clinics are pre-verified with a 30-day trial
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
      businessType: data.businessType ?? 'general',
      showAppointments: data.showAppointments ?? true,
      emailVerified: true,
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
      country: brand.country,
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
  return prisma.$transaction(async (tx) => {
    // Delete all related models in dependency order
    await tx.pushSubscription.deleteMany({
      where: { entry: { clinicId } },
    });
    await tx.queueEntry.deleteMany({ where: { clinicId } });
    await tx.scheduleSlot.deleteMany({ where: { clinicId } });
    await tx.doctorDailyStat.deleteMany({ where: { clinicId } });
    await tx.doctor.deleteMany({ where: { clinicId } });
    await tx.patient.deleteMany({ where: { clinicId } });
    await tx.hourlyStat.deleteMany({ where: { clinicId } });
    await tx.dailyStat.deleteMany({ where: { clinicId } });
    await tx.paymentRecord.deleteMany({ where: { clinicId } });
    await tx.subscriptionEvent.deleteMany({ where: { clinicId } });

    return tx.clinic.delete({
      where: { id: clinicId },
      select: { id: true, name: true },
    });
  });
}

export async function deleteClinics(clinicIds: string[]) {
  return prisma.$transaction(async (tx) => {
    const where = { clinicId: { in: clinicIds } };
    await tx.pushSubscription.deleteMany({ where: { entry: { clinicId: { in: clinicIds } } } });
    await tx.queueEntry.deleteMany({ where });
    await tx.scheduleSlot.deleteMany({ where });
    await tx.doctorDailyStat.deleteMany({ where });
    await tx.doctor.deleteMany({ where });
    await tx.patient.deleteMany({ where });
    await tx.hourlyStat.deleteMany({ where });
    await tx.dailyStat.deleteMany({ where });
    await tx.paymentRecord.deleteMany({ where });
    await tx.subscriptionEvent.deleteMany({ where });

    const result = await tx.clinic.deleteMany({ where: { id: { in: clinicIds } } });
    return { count: result.count };
  });
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

  // Use groupBy to get all subscription status counts in a single query
  // instead of 6+ parallel count queries that exhaust the pgbouncer pool
  const statusGroups = await prisma.clinic.groupBy({
    by: ['subscriptionStatus'],
    where: { isActive: true, ...countryFilter },
    _count: true,
  });

  const statusMap: Record<string, number> = {};
  for (const g of statusGroups) {
    statusMap[g.subscriptionStatus || ''] = g._count;
  }

  const trialCount = statusMap['TRIAL'] || 0;
  const activeCount = statusMap['ACTIVE'] || 0;
  const expiredCount = statusMap['EXPIRED'] || 0;
  const cancelledCount = statusMap['CANCELLED'] || 0;
  const totalClinics = Object.values(statusMap).reduce((a, b) => a + b, 0);

  // Sequential queries to avoid pool exhaustion
  const dailyActive = await prisma.clinic.count({
    where: { lastLoginAt: { gte: startOfToday }, isActive: true, ...countryFilter },
  });

  const everPaid = await prisma.subscriptionEvent.findMany({
    where: { eventType: 'payment_success', ...clinicCountryFilter },
    select: { clinicId: true },
    distinct: ['clinicId'],
  });
  const conversionRate = totalClinics > 0
    ? Math.round((everPaid.length / totalClinics) * 100)
    : 0;

  // MRR: use groupBy on plan for active clinics
  const planGroups = await prisma.clinic.groupBy({
    by: ['subscriptionPlan'],
    where: { subscriptionStatus: 'ACTIVE', ...countryFilter },
    _count: true,
  });
  const planMap: Record<string, number> = {};
  for (const g of planGroups) {
    planMap[g.subscriptionPlan || ''] = g._count;
  }
  const mrrMonthly = brand.pricing.monthly / brand.currency.multiplier;
  const mrrYearly = brand.pricing.yearly / brand.currency.multiplier;
  const mrrActual = ((planMap['MONTHLY'] || 0) * mrrMonthly) + Math.round((planMap['YEARLY'] || 0) * (mrrYearly / 12));

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
  // Use sequential queries to avoid pgbouncer pool exhaustion
  const totalSignups = await prisma.clinic.count({ where: { ...countryFilter } });
  const step1Plus = await prisma.clinic.count({ where: { onboardingStep: { gte: 1 }, ...countryFilter } });
  const step2Plus = await prisma.clinic.count({ where: { onboardingStep: { gte: 2 }, ...countryFilter } });
  const completed = await prisma.clinic.count({ where: { onboardingCompleted: true, ...countryFilter } });

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
    where: { ...clinicCountryFilter },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      clinic: { select: { name: true } },
    },
  });

  const typeDescriptions: Record<string, (clinicName: string, amount?: number | null) => string> = {
    trial_started: (name) => `${name} started a free trial`,
    trial_expired: (name) => `${name}'s trial has expired`,
    payment_success: (name, amount) => `${name} subscribed${amount ? ` (${(amount / brand.currency.multiplier).toFixed(0)} ${brand.currency.symbol})` : ''}`,
    payment_failed: (name) => `Payment failed for ${name}`,
    payment_initiated: (name) => `${name} initiated a payment`,
    subscription_activated: (name) => `${name}'s subscription activated`,
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
  // Single groupBy instead of 6 parallel counts
  const statusCounts = await prisma.clinic.groupBy({
    by: ['subscriptionStatus'],
    where: { ...countryFilter },
    _count: true,
  });
  const sMap: Record<string, number> = {};
  for (const g of statusCounts) { sMap[g.subscriptionStatus || ''] = g._count; }
  const trial = sMap['TRIAL'] || 0;
  const pastDue = sMap['PAST_DUE'] || 0;
  const expired = sMap['EXPIRED'] || 0;
  const cancelled = sMap['CANCELLED'] || 0;

  const planCounts = await prisma.clinic.groupBy({
    by: ['subscriptionPlan'],
    where: { subscriptionStatus: 'ACTIVE', ...countryFilter },
    _count: true,
  });
  const pMap: Record<string, number> = {};
  for (const g of planCounts) { pMap[g.subscriptionPlan || ''] = g._count; }
  const monthlyActive = pMap['MONTHLY'] || 0;
  const yearlyActive = pMap['YEARLY'] || 0;

  const finMonthlyMajor = brand.pricing.monthly / brand.currency.multiplier;
  const finYearlyMajor = brand.pricing.yearly / brand.currency.multiplier;
  const currentMrr = (monthlyActive * finMonthlyMajor) + Math.round(yearlyActive * (finYearlyMajor / 12));
  const totalPaying = monthlyActive + yearlyActive;
  const arpu = totalPaying > 0 ? Math.round(currentMrr / totalPaying) : 0;

  // MRR history (last 12 months) from PaymentRecord
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await prisma.paymentRecord.findMany({
    where: { month: { gte: twelveMonthsAgo }, status: 'paid', ...clinicCountryFilter },
    select: { amount: true, month: true },
  });

  // Subscription events for new/churned MRR
  const subEvents = await prisma.subscriptionEvent.findMany({
    where: { createdAt: { gte: twelveMonthsAgo }, ...clinicCountryFilter },
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
      entry.totalMrr += Math.round(p.amount / brand.currency.multiplier);
    }
  });

  // Track new and churned from subscription events
  subEvents.forEach((event) => {
    const monthKey = event.createdAt.toISOString().slice(0, 7);
    const entry = mrrHistoryMap.get(monthKey);
    if (!entry) return;
    const amountMajor = event.amount ? Math.round(event.amount / brand.currency.multiplier) : finMonthlyMajor;
    if (event.eventType === 'payment_success') {
      entry.newMrr += amountMajor;
    } else if (event.eventType === 'subscription_expired' || event.eventType === 'subscription_cancelled' || event.eventType === 'trial_expired') {
      entry.churnedMrr += finMonthlyMajor; // Lost potential MRR
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
      ...clinicCountryFilter,
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
  };
  multiDoctorClinics: number;
  avgPatientsPerClinicPerDay: number;
}

export async function getFeatureAdoption(): Promise<FeatureAdoption> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Check-in method distribution (last 30 days)
  // Single groupBy instead of 5 parallel counts
  const checkinGroups = await prisma.queueEntry.groupBy({
    by: ['checkInMethod'],
    where: { arrivedAt: { gte: thirtyDaysAgo }, ...clinicCountryFilter },
    _count: true,
  });
  const cMap: Record<string, number> = {};
  for (const g of checkinGroups) { cMap[g.checkInMethod || ''] = g._count; }
  const qrCount = cMap['QR_CODE'] || 0;
  const manualCount = cMap['MANUAL'] || 0;
  const whatsAppCount = cMap['WHATSAPP'] || 0;
  const totalEntries = Object.values(cMap).reduce((a, b) => a + b, 0);

  const pct = (n: number) => totalEntries > 0 ? Math.round((n / totalEntries) * 100) : 0;

  // Multi-doctor adoption
  const clinicsWithDoctors = await prisma.doctor.findMany({
    where: { isActive: true, ...clinicCountryFilter },
    select: { clinicId: true },
    distinct: ['clinicId'],
  });

  // Avg patients per clinic per day (last 30 days)
  const activeClinics = await prisma.clinic.count({ where: { isActive: true, ...countryFilter } });
  const avgPatientsPerClinicPerDay = activeClinics > 0 && totalEntries > 0
    ? Math.round((totalEntries / 30 / activeClinics) * 10) / 10
    : 0;

  return {
    checkInMethods: {
      qrCode: { count: qrCount, percentage: pct(qrCount) },
      manual: { count: manualCount, percentage: pct(manualCount) },
      whatsApp: { count: whatsAppCount, percentage: pct(whatsAppCount) },
    },
    multiDoctorClinics: clinicsWithDoctors.length,
    avgPatientsPerClinicPerDay,
  };
}

// ─── V2: Platform Health ────────────────────────────────────

export interface PlatformHealth {
  services: {
    api: 'healthy' | 'degraded' | 'down';
    database: 'healthy' | 'degraded' | 'down';
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

  // Clinic breakdown
  // Sequential to prevent pool exhaustion
  const totalClinics = await prisma.clinic.count({ where: { ...countryFilter } });
  const activeClinics = await prisma.clinic.count({ where: { isActive: true, ...countryFilter } });
  const clinicsOnTrial = await prisma.clinic.count({ where: { subscriptionStatus: 'TRIAL', ...countryFilter } });
  const clinicsPaid = await prisma.clinic.count({ where: { subscriptionStatus: 'ACTIVE', ...countryFilter } });

  return {
    services: {
      api: 'healthy', // If we're responding, API is healthy
      database: dbStatus,
    },
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
      amount: plan === 'MONTHLY' ? brand.pricing.monthly : brand.pricing.yearly,
      notes: `Manually upgraded to ${plan} by admin`,
    },
  });

  return updated;
}

// ─── V4: Enriched Clinic Detail ──────────────────────────────

export interface ClinicDetailEnrichedResponse {
  // Identity
  id: string;
  name: string;
  doctorName: string;
  doctorEmail: string;
  phone: string;
  address: string;
  language: string;
  specialty: string;
  joinedAt: string;

  // Subscription
  plan: 'TRIAL' | 'PAID' | 'CHURNED';
  trialEndsAt: string | null;
  daysUntilTrialExpires: number | null;
  trialProgressPercent: number;
  adminExtensionsGiven: number;

  // Health
  healthScore: 1 | 2 | 3 | 4;
  healthLabel: 'Strong' | 'Good' | 'Fair' | 'Weak';
  healthColor: 'green' | 'orange' | 'red';
  churnRisk: 'high' | 'medium' | 'low' | 'none';
  suggestedAction: {
    label: string;
    sublabel: string;
    cta: string;
    urgency: 'high' | 'medium' | 'low';
  };

  // Performance KPIs
  patientsAllTime: number;
  patientsLast30Days: number;
  avgPatientsPerDay: number;
  qrAdoptionRate: number;
  qrCheckInsLast30Days: number;
  manualCheckInsLast30Days: number;
  whatsappCheckInsLast30Days: number;
  avgWaitTimeMinutes: number;
  avgWaitTimeChangeVsLastWeek: number;
  avgConsultationMinutes: number;
  avgConsultationConfigured: number;
  noShowRate: number;
  peakHourRange: string;
  lastLoginAt: string | null;
  lastActiveDaysAgo: number | null;

  // Configuration
  notifyAtPosition: number;
  qrCodeActive: boolean;
  qrCodeLastScannedAt: string | null;
  isActive: boolean;

  // Onboarding
  onboardingStep: number;
  onboardingTotalSteps: number;
  onboardingStepLabel: string;
  onboardingComplete: boolean;

  // Today's Activity
  todayActivity: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
    avgWaitMinutesToday: number | null;
    qrCheckInsToday: number;
    totalCheckInsToday: number;
    peakHourToday: string | null;
    dayLabel: string;
  };
  typicalActivity: {
    waiting: number;
    inConsultation: number;
    completed: number;
    noShows: number;
    cancelled: number;
    avgWaitMinutes: number | null;
  };

  // Chart Data
  weeklyChartData: {
    days: Array<{
      label: string;
      thisWeek: number;
      lastWeek: number;
      isToday: boolean;
    }>;
    thisWeekTotal: number;
    lastWeekTotal: number;
    weekOnWeekChangePct: number;
    bestDayLabel: string;
    avgWaitThisWeek: number | null;
  };
  monthlyChartData: {
    days: Array<{ date: string; count: number }>;
    peakDayLabel: string;
    activeDays: number;
    zeroDays: number;
    avgPerActiveDay: number;
  };
  methodChartData: {
    manual: number;
    qr: number;
    whatsapp: number;
    totalLast30Days: number;
    qrGrowing: boolean;
    qrGrowthNote: string | null;
  };

  // Timeline
  timeline: Array<{
    id: string;
    icon: 'check' | 'star' | 'warning' | 'admin' | 'info';
    color: 'green' | 'brand' | 'orange' | 'admin' | 'gray';
    title: string;
    meta: string;
    timestamp: string;
    isAdminAction: boolean;
    adminBadgeLabel?: string;
  }>;

  // Patients Tab
  recentPatients: Array<{
    sequenceNumber: number;
    date: string;
    arrivedAt: string;
    waitMinutes: number | null;
    consultMinutes: number | null;
    checkInMethod: 'QR' | 'MANUAL' | 'WHATSAPP';
    status: 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'IN_CONSULTATION';
    notes: string | null;
  }>;
}

const ONBOARDING_STEP_LABELS: Record<number, string> = {
  0: 'Not started',
  1: 'Profile Setup',
  2: 'Doctor Setup',
  3: 'Queue Setup',
  4: 'QR Code',
};

const DAY_LABELS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatDateDDMM(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatDateDDMMYYYY(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export async function getClinicDetailEnriched(clinicId: string): Promise<ClinicDetailEnrichedResponse> {
  const now = new Date();
  const startOfToday = getStartOfToday();
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // ── 1. Fetch clinic ────────────────────────────────────
  const clinic = await prisma.clinic.findUniqueOrThrow({
    where: { id: clinicId },
    include: {
      doctors: {
        select: { id: true, name: true, specialty: true, isActive: true, avgConsultationMins: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // ── 2. Plan classification ──────────────────────────────
  let plan: 'TRIAL' | 'PAID' | 'CHURNED';
  if (clinic.subscriptionStatus === 'TRIAL') plan = 'TRIAL';
  else if (clinic.subscriptionStatus === 'ACTIVE') plan = 'PAID';
  else plan = 'CHURNED';

  const daysUntilTrialExpires = clinic.trialEndsAt
    ? Math.ceil((clinic.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Trial progress: how far through the 30-day trial
  let trialProgressPercent = 0;
  if (clinic.trialEndsAt) {
    const trialDuration = 30; // days
    const trialStartApprox = new Date(clinic.trialEndsAt);
    trialStartApprox.setDate(trialStartApprox.getDate() - trialDuration);
    const elapsed = (now.getTime() - trialStartApprox.getTime()) / (1000 * 60 * 60 * 24);
    trialProgressPercent = Math.max(0, Math.min(100, Math.round((elapsed / trialDuration) * 100)));
  }

  // Admin extensions count
  const adminExtensionsGiven = await prisma.subscriptionEvent.count({
    where: { clinicId, eventType: 'trial_extended' },
  });

  // ── 3. Last 30 days stats (from DailyStat, not raw QueueEntry) ──
  const stats30d = await prisma.dailyStat.findMany({
    where: { clinicId, date: { gte: thirtyDaysAgo } },
    select: {
      date: true, totalPatients: true, noShows: true,
      totalWaitMins: true, patientsWithWait: true,
      totalConsultMins: true, patientsWithConsult: true,
      checkInQr: true, checkInManual: true, checkInWhatsapp: true,
      peakHour: true,
    },
    orderBy: { date: 'desc' },
  });

  // All-time count (from DailyStat aggregate + today's live)
  const allTimeAgg2 = await prisma.dailyStat.aggregate({
    where: { clinicId },
    _sum: { totalPatients: true, noShows: true },
  });
  const todayLiveCount = await prisma.queueEntry.count({ where: { clinicId, arrivedAt: { gte: startOfToday } } });
  const patientsAllTime = (allTimeAgg2._sum.totalPatients || 0) + todayLiveCount;

  const patientsLast30Days = stats30d.reduce((s, d) => s + d.totalPatients, 0) + todayLiveCount;
  const avgPatientsPerDay = Math.round((patientsLast30Days / 30) * 10) / 10;

  // Check-in method counts (30d)
  const qrCheckInsLast30Days = stats30d.reduce((s, d) => s + d.checkInQr, 0);
  const manualCheckInsLast30Days = stats30d.reduce((s, d) => s + d.checkInManual, 0);
  const whatsappCheckInsLast30Days = stats30d.reduce((s, d) => s + d.checkInWhatsapp, 0);
  const qrAdoptionRate = patientsLast30Days > 0
    ? Math.round((qrCheckInsLast30Days / patientsLast30Days) * 100) : 0;

  // Wait time (30d) — accurate cross-day average from sums
  const waitSum30d = stats30d.reduce((s, d) => s + d.totalWaitMins, 0);
  const waitCount30d = stats30d.reduce((s, d) => s + d.patientsWithWait, 0);
  const avgWaitTimeMinutes = waitCount30d > 0 ? Math.round(waitSum30d / waitCount30d) : 0;

  // Consultation time (30d)
  const consultSum30d = stats30d.reduce((s, d) => s + d.totalConsultMins, 0);
  const consultCount30d = stats30d.reduce((s, d) => s + d.patientsWithConsult, 0);
  const avgConsultationMinutes = consultCount30d > 0 ? Math.round(consultSum30d / consultCount30d) : 0;

  // No-show rate (30d)
  const noShowCount = stats30d.reduce((s, d) => s + d.noShows, 0);
  const noShowRate = patientsLast30Days > 0 ? Math.round((noShowCount / patientsLast30Days) * 100) : 0;

  // Wait time change vs last week (from DailyStat)
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(startOfToday);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const thisWeekStats = stats30d.filter(d => d.date >= sevenDaysAgo);
  const lastWeekStats = stats30d.filter(d => d.date >= fourteenDaysAgo && d.date < sevenDaysAgo);

  const thisWeekWaitSum = thisWeekStats.reduce((s, d) => s + d.totalWaitMins, 0);
  const thisWeekWaitCount = thisWeekStats.reduce((s, d) => s + d.patientsWithWait, 0);
  const lastWeekWaitSum = lastWeekStats.reduce((s, d) => s + d.totalWaitMins, 0);
  const lastWeekWaitCount = lastWeekStats.reduce((s, d) => s + d.patientsWithWait, 0);

  const avgWaitThisWeek = thisWeekWaitCount > 0 ? Math.round(thisWeekWaitSum / thisWeekWaitCount) : null;
  const avgWaitLastWeek = lastWeekWaitCount > 0 ? Math.round(lastWeekWaitSum / lastWeekWaitCount) : null;

  const avgWaitTimeChangeVsLastWeek = (avgWaitThisWeek !== null && avgWaitLastWeek !== null)
    ? avgWaitThisWeek - avgWaitLastWeek
    : 0;

  // Peak hour range (from HourlyStat 30d)
  const hourlyAgg = await prisma.hourlyStat.groupBy({
    by: ['hour'],
    where: { clinicId, date: { gte: thirtyDaysAgo } },
    _sum: { arrivals: true },
    orderBy: { _sum: { arrivals: 'desc' } },
    take: 1,
  });
  const peakHour = hourlyAgg.length > 0 ? hourlyAgg[0].hour : 9;
  const peakHourRange = `${String(peakHour).padStart(2, '0')}:00–${String(peakHour + 2).padStart(2, '0')}:00`;

  // Fetch today's live QueueEntry for activity section + recent patients list
  const todayEntries = await prisma.queueEntry.findMany({
    where: { clinicId, arrivedAt: { gte: startOfToday } },
    select: {
      id: true, status: true, checkInMethod: true,
      arrivedAt: true, calledAt: true, completedAt: true, patientName: true,
    },
    orderBy: { arrivedAt: 'desc' },
  });

  // Last active
  const lastActiveDaysAgo = clinic.lastLoginAt
    ? Math.floor((now.getTime() - clinic.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // ── 4. Health Score ─────────────────────────────────────
  let score = 0;
  if (patientsLast30Days >= 20) score += 2;
  else if (patientsLast30Days >= 5) score += 1;
  if (qrAdoptionRate >= 20) score += 1;
  if (lastActiveDaysAgo !== null && lastActiveDaysAgo <= 2) score += 1;
  const healthScore = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;

  const healthMap: Record<number, { label: 'Strong' | 'Good' | 'Fair' | 'Weak'; color: 'green' | 'orange' | 'red' }> = {
    4: { label: 'Strong', color: 'green' },
    3: { label: 'Good', color: 'orange' },
    2: { label: 'Fair', color: 'orange' },
    1: { label: 'Weak', color: 'red' },
  };
  const { label: healthLabel, color: healthColor } = healthMap[healthScore];

  // Churn risk
  const isInternal = brand.adminEmails.map(e => e.toLowerCase()).includes(clinic.email.toLowerCase());
  let churnRisk: 'high' | 'medium' | 'low' | 'none';
  if (isInternal) churnRisk = 'none';
  else if (lastActiveDaysAgo !== null && lastActiveDaysAgo >= 10 && patientsLast30Days < 5) churnRisk = 'high';
  else if (qrCheckInsLast30Days === 0 || patientsLast30Days < 10) churnRisk = 'medium';
  else if (healthScore >= 3) churnRisk = 'low';
  else churnRisk = 'medium';

  // ── 5. Suggested Action ─────────────────────────────────
  let suggestedAction: ClinicDetailEnrichedResponse['suggestedAction'];
  if (plan === 'TRIAL' && daysUntilTrialExpires !== null && daysUntilTrialExpires <= 21 && healthScore >= 3) {
    suggestedAction = {
      label: 'Convert to paid',
      sublabel: `trial ends ${clinic.trialEndsAt ? formatDateDDMM(clinic.trialEndsAt) : '—'}`,
      cta: 'Send payment link →',
      urgency: daysUntilTrialExpires <= 7 ? 'high' : 'medium',
    };
  } else if (qrAdoptionRate === 0 && !isInternal) {
    suggestedAction = {
      label: 'Boost QR adoption',
      sublabel: '100% manual check-in',
      cta: 'Send QR setup guide →',
      urgency: 'medium',
    };
  } else if (lastActiveDaysAgo !== null && lastActiveDaysAgo >= 7) {
    suggestedAction = {
      label: 'Re-engage clinic',
      sublabel: `inactive ${lastActiveDaysAgo} days`,
      cta: 'Send check-in message →',
      urgency: lastActiveDaysAgo >= 14 ? 'high' : 'medium',
    };
  } else if (!clinic.onboardingCompleted) {
    suggestedAction = {
      label: 'Complete onboarding',
      sublabel: `stuck at step ${clinic.onboardingStep}/4`,
      cta: 'Send setup guide →',
      urgency: 'low',
    };
  } else {
    suggestedAction = {
      label: 'Monitor',
      sublabel: 'no immediate action needed',
      cta: 'View analytics →',
      urgency: 'low',
    };
  }

  // ── 6. QR code status ───────────────────────────────────
  const lastQrEntry = await prisma.queueEntry.findFirst({
    where: { clinicId, checkInMethod: 'QR_CODE' },
    orderBy: { arrivedAt: 'desc' },
    select: { arrivedAt: true },
  });
  const qrCodeActive = qrCheckInsLast30Days > 0 || clinic.onboardingStep >= 4;
  const qrCodeLastScannedAt = lastQrEntry?.arrivedAt.toISOString() ?? null;

  // ── 7. Today's Activity ─────────────────────────────────
  const todayWaiting = todayEntries.filter(e => e.status === 'WAITING' || e.status === 'NOTIFIED').length;
  const todayInConsultation = todayEntries.filter(e => e.status === 'IN_CONSULTATION').length;
  const todayCompleted = todayEntries.filter(e => e.status === 'COMPLETED').length;
  const todayNoShows = todayEntries.filter(e => e.status === 'NO_SHOW').length;
  const todayCancelled = todayEntries.filter(e => e.status === 'CANCELLED').length;
  const todayQrCheckIns = todayEntries.filter(e => e.checkInMethod === 'QR_CODE').length;

  // Today's avg wait
  const todaySeen = todayEntries.filter(e => e.calledAt && (e.status === 'IN_CONSULTATION' || e.status === 'COMPLETED'));
  let avgWaitMinutesToday: number | null = null;
  if (todaySeen.length > 0) {
    const waits = todaySeen.map(e => Math.round((e.calledAt!.getTime() - e.arrivedAt.getTime()) / 60000));
    avgWaitMinutesToday = Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
  }

  // Today's peak hour
  const todayHourCounts = new Map<number, number>();
  for (const e of todayEntries) {
    const h = e.arrivedAt.getHours();
    todayHourCounts.set(h, (todayHourCounts.get(h) || 0) + 1);
  }
  let peakHourToday: string | null = null;
  if (todayHourCounts.size > 0) {
    let maxH = 0, maxC = 0;
    for (const [h, c] of todayHourCounts) {
      if (c > maxC) { maxH = h; maxC = c; }
    }
    // Find the range of consecutive peak hours
    let endH = maxH + 1;
    while (todayHourCounts.has(endH) && (todayHourCounts.get(endH) || 0) > 0) endH++;
    peakHourToday = `${String(maxH).padStart(2, '0')}:00–${String(Math.min(endH, maxH + 2)).padStart(2, '0')}:00`;
  }

  const localNowForDay = new Date(now.getTime() + getTimezoneOffsetMinutes() * 60000);
  const dayOfWeek = localNowForDay.getUTCDay();
  const dayName = FULL_DAY_NAMES[dayOfWeek];
  const dayLabel = `${dayName} ${formatDateDDMM(localNowForDay)}`;

  // ── 8. Typical Activity (last 4 same weekdays) ──────────
  // Get DailyStat entries for same weekday
  const dailyStatsForWeekday = await prisma.dailyStat.findMany({
    where: {
      clinicId,
      date: { lt: startOfToday },
    },
    orderBy: { date: 'desc' },
    take: 60, // Get last 60 days of stats, we'll filter by weekday
  });

  // Filter to same day of week, take last 4
  const sameWeekdayStats = dailyStatsForWeekday
    .filter(s => s.date.getDay() === dayOfWeek)
    .slice(0, 4);

  // Also get queue entries for those days to compute status breakdowns
  let typicalActivity: ClinicDetailEnrichedResponse['typicalActivity'] = {
    waiting: 0, inConsultation: 0, completed: 0, noShows: 0, cancelled: 0, avgWaitMinutes: null,
  };

  if (sameWeekdayStats.length > 0) {
    const avgPatients = Math.round(sameWeekdayStats.reduce((a, s) => a + s.totalPatients, 0) / sameWeekdayStats.length);
    const avgWait = sameWeekdayStats.filter(s => s.avgWaitMins !== null).length > 0
      ? Math.round(sameWeekdayStats.filter(s => s.avgWaitMins !== null).reduce((a, s) => a + (s.avgWaitMins || 0), 0) / sameWeekdayStats.filter(s => s.avgWaitMins !== null).length)
      : null;
    const avgNoShows = Math.round(sameWeekdayStats.reduce((a, s) => a + s.noShows, 0) / sameWeekdayStats.length);

    typicalActivity = {
      waiting: 0, // Not tracked in DailyStat (end-of-day it's 0)
      inConsultation: 0,
      completed: avgPatients,
      noShows: avgNoShows,
      cancelled: 0,
      avgWaitMinutes: avgWait,
    };
  }

  // ── 9. Weekly Chart Data ────────────────────────────────
  // This week = Mon to Sun of current week
  // Use timezone-aware day-of-week to avoid UTC boundary issues
  const tzOffsetMs = getTimezoneOffsetMinutes() * 60000;
  const localNow = new Date(now.getTime() + tzOffsetMs);
  const todayDow = localNow.getUTCDay(); // 0=Sun, correct for brand timezone
  const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
  const thisMonday = new Date(startOfToday);
  thisMonday.setDate(thisMonday.getDate() + mondayOffset);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  // Get DailyStat for last 2 weeks
  const twoWeekStats = await prisma.dailyStat.findMany({
    where: { clinicId, date: { gte: lastMonday, lt: startOfToday } },
    select: { date: true, totalPatients: true },
  });
  const statsMap = new Map<string, number>();
  for (const s of twoWeekStats) {
    statsMap.set(s.date.toISOString().split('T')[0], s.totalPatients);
  }

  // Today's date key — apply timezone offset so date string matches local calendar day
  const todayDateKey = new Date(startOfToday.getTime() + tzOffsetMs)
    .toISOString().split('T')[0];

  const weekDays: ClinicDetailEnrichedResponse['weeklyChartData']['days'] = [];
  let thisWeekTotal = 0, lastWeekTotal = 0;
  let bestDayCount = 0, bestDayLabel = '';

  // Mon-Sun day labels in French
  const dayLabels = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];

  for (let i = 0; i < 7; i++) {
    const thisWeekDate = new Date(thisMonday);
    thisWeekDate.setDate(thisWeekDate.getDate() + i);
    const lastWeekDate = new Date(lastMonday);
    lastWeekDate.setDate(lastWeekDate.getDate() + i);

    // Apply timezone offset so date keys match local calendar (and DailyStat noon-UTC keys)
    const twKey = new Date(thisWeekDate.getTime() + tzOffsetMs).toISOString().split('T')[0];
    const lwKey = new Date(lastWeekDate.getTime() + tzOffsetMs).toISOString().split('T')[0];

    const isToday = twKey === todayDateKey;
    const thisWeekCount = isToday ? todayEntries.length : (statsMap.get(twKey) || 0);
    const lastWeekCount = statsMap.get(lwKey) || 0;

    // Only count days that have happened or are today
    if (thisWeekDate <= now) {
      thisWeekTotal += thisWeekCount;
    }
    lastWeekTotal += lastWeekCount;

    if (thisWeekCount > bestDayCount && thisWeekDate <= now) {
      bestDayCount = thisWeekCount;
      bestDayLabel = `${FULL_DAY_NAMES[(i + 1) % 7 || 7 === 7 ? (i + 1) % 7 : i]} (${thisWeekCount} patients)`;
    }

    weekDays.push({
      label: dayLabels[i],
      thisWeek: thisWeekDate <= now ? thisWeekCount : 0,
      lastWeek: lastWeekCount,
      isToday,
    });
  }

  // Fix bestDayLabel using the actual day name
  if (bestDayCount > 0) {
    const bestIdx = weekDays.findIndex(d => d.thisWeek === bestDayCount);
    if (bestIdx >= 0) {
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      bestDayLabel = `${dayNames[bestIdx]} (${bestDayCount} patients)`;
    }
  }

  const weekOnWeekChangePct = lastWeekTotal > 0
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : (thisWeekTotal > 0 ? 100 : 0);

  // ── 10. Monthly Chart Data ──────────────────────────────
  const monthlyDailyStats = await prisma.dailyStat.findMany({
    where: { clinicId, date: { gte: thirtyDaysAgo, lt: startOfToday } },
    select: { date: true, totalPatients: true },
    orderBy: { date: 'asc' },
  });

  const monthlyStatsMap = new Map<string, number>();
  for (const s of monthlyDailyStats) {
    monthlyStatsMap.set(s.date.toISOString().split('T')[0], s.totalPatients);
  }

  const monthlyDays: Array<{ date: string; count: number }> = [];
  let peakDayCount = 0, peakDayLabel = '';
  let activeDays = 0, zeroDays = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    // Apply timezone offset for correct local date key and day-of-week
    const dLocal = new Date(d.getTime() + tzOffsetMs);
    const key = dLocal.toISOString().split('T')[0];
    const count = i === 0 ? todayEntries.length : (monthlyStatsMap.get(key) || 0);

    monthlyDays.push({ date: formatDateDDMM(dLocal), count });

    if (count > 0) activeDays++;
    else zeroDays++;

    if (count > peakDayCount) {
      peakDayCount = count;
      peakDayLabel = `${count} patients (${DAY_LABELS_FR[dLocal.getUTCDay()].replace('.', '')} ${formatDateDDMM(dLocal)})`;
    }
  }

  const avgPerActiveDay = activeDays > 0 ? Math.round((patientsLast30Days / activeDays) * 10) / 10 : 0;

  // ── 11. Method Chart Data ──────────────────────────────
  // QR growth: compare first 7d vs last 7d of the 30d period (from DailyStat)
  const twentyThreeDaysAgo = new Date(startOfToday);
  twentyThreeDaysAgo.setDate(twentyThreeDaysAgo.getDate() - 23);
  const first7dStats = stats30d.filter(d => d.date < twentyThreeDaysAgo);
  const last7dStats = stats30d.filter(d => d.date >= sevenDaysAgo);

  const first7dTotal = first7dStats.reduce((s, d) => s + d.totalPatients, 0);
  const first7dQr = first7dStats.reduce((s, d) => s + d.checkInQr, 0);
  const last7dTotal = last7dStats.reduce((s, d) => s + d.totalPatients, 0);
  const last7dQr = last7dStats.reduce((s, d) => s + d.checkInQr, 0);

  const first7dQrRate = first7dTotal > 0 ? Math.round((first7dQr / first7dTotal) * 100) : 0;
  const last7dQrRate = last7dTotal > 0 ? Math.round((last7dQr / last7dTotal) * 100) : 0;
  const qrGrowing = last7dQrRate > first7dQrRate;
  const qrGrowthNote = qrGrowing
    ? `Went from ${first7dQrRate}% in week 1 to ${last7dQrRate}% in week 4`
    : null;

  // ── 12. Timeline ────────────────────────────────────────
  const timeline: ClinicDetailEnrichedResponse['timeline'] = [];

  // First QR scan
  const firstQrEntry = await prisma.queueEntry.findFirst({
    where: { clinicId, checkInMethod: 'QR_CODE' },
    orderBy: { arrivedAt: 'asc' },
    select: { id: true, arrivedAt: true },
  });
  if (firstQrEntry) {
    timeline.push({
      id: `qr-${firstQrEntry.id}`,
      icon: 'star',
      color: 'brand',
      title: 'First QR scan by patient',
      meta: `${formatDateDDMMYYYY(firstQrEntry.arrivedAt)} · Patient self-checked in via QR for the first time — product value unlocked`,
      timestamp: firstQrEntry.arrivedAt.toISOString(),
      isAdminAction: false,
      adminBadgeLabel: 'Aha Moment',
    });
  }

  // First patient check-in
  const firstEntry = await prisma.queueEntry.findFirst({
    where: { clinicId },
    orderBy: { arrivedAt: 'asc' },
    select: { id: true, arrivedAt: true, checkInMethod: true },
  });
  if (firstEntry) {
    timeline.push({
      id: `first-${firstEntry.id}`,
      icon: 'check',
      color: 'green',
      title: 'First patient checked in',
      meta: `${formatDateDDMMYYYY(firstEntry.arrivedAt)} · ${firstEntry.checkInMethod === 'QR_CODE' ? 'QR' : 'Manual'} check-in`,
      timestamp: firstEntry.arrivedAt.toISOString(),
      isAdminAction: false,
    });
  }

  // Onboarding incomplete warning
  if (!clinic.onboardingCompleted) {
    timeline.push({
      id: 'onboarding-incomplete',
      icon: 'warning',
      color: 'orange',
      title: 'Queue setup incomplete',
      meta: `Stuck at Step ${clinic.onboardingStep}/4 — ${ONBOARDING_STEP_LABELS[clinic.onboardingStep] || 'Unknown'}`,
      timestamp: clinic.createdAt.toISOString(),
      isAdminAction: false,
    });
  }

  // Clinic created
  timeline.push({
    id: 'created',
    icon: 'check',
    color: 'green',
    title: 'Clinic profile created',
    meta: `${formatDateDDMMYYYY(clinic.createdAt)} · Signed up via doctorq.tn · ${clinic.email}`,
    timestamp: clinic.createdAt.toISOString(),
    isAdminAction: false,
  });

  // Trial started
  timeline.push({
    id: 'trial-started',
    icon: 'check',
    color: 'green',
    title: 'Trial started',
    meta: `${formatDateDDMMYYYY(clinic.createdAt)} · 30-day trial${clinic.trialEndsAt ? ` · Expires ${formatDateDDMMYYYY(clinic.trialEndsAt)}` : ''}`,
    timestamp: clinic.createdAt.toISOString(),
    isAdminAction: false,
  });

  // Admin actions from subscription events
  const adminEvents = await prisma.subscriptionEvent.findMany({
    where: { clinicId, eventType: { in: ['trial_extended', 'subscription_activated'] } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, eventType: true, notes: true, createdAt: true },
  });

  for (const evt of adminEvents) {
    timeline.push({
      id: `event-${evt.id}`,
      icon: 'admin',
      color: 'admin',
      title: evt.eventType === 'trial_extended' ? 'Trial extended' : 'Subscription activated',
      meta: `${evt.notes || ''} · ${formatDateDDMMYYYY(evt.createdAt)}`,
      timestamp: evt.createdAt.toISOString(),
      isAdminAction: true,
      adminBadgeLabel: 'Admin action',
    });
  }

  // Sort timeline by timestamp descending
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ── 13. Recent Patients ─────────────────────────────────
  const recentEntries = todayEntries.slice(0, 50); // today's entries, sorted desc
  const recentPatients = recentEntries.map((e, idx) => {
    const waitMinutes = e.calledAt
      ? Math.round((e.calledAt.getTime() - e.arrivedAt.getTime()) / 60000) : null;
    const consultMinutes = (e.completedAt && e.calledAt)
      ? Math.round((e.completedAt.getTime() - e.calledAt.getTime()) / 60000) : null;

    return {
      sequenceNumber: patientsLast30Days - idx,
      date: formatDateDDMMYYYY(e.arrivedAt),
      arrivedAt: formatTime(e.arrivedAt),
      waitMinutes,
      consultMinutes,
      checkInMethod: (e.checkInMethod === 'QR_CODE' ? 'QR' : e.checkInMethod === 'WHATSAPP' ? 'WHATSAPP' : 'MANUAL') as 'QR' | 'MANUAL' | 'WHATSAPP',
      status: e.status as 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'IN_CONSULTATION',
      notes: null,
    };
  });

  // ── Build response ──────────────────────────────────────
  return {
    id: clinic.id,
    name: clinic.name,
    doctorName: clinic.doctorName || '',
    doctorEmail: clinic.email,
    phone: clinic.phone || '',
    address: clinic.address || '',
    language: clinic.language,
    specialty: clinic.doctors[0]?.specialty || clinic.businessType || 'Medical',
    joinedAt: clinic.createdAt.toISOString(),

    plan,
    trialEndsAt: clinic.trialEndsAt?.toISOString() ?? null,
    daysUntilTrialExpires,
    trialProgressPercent,
    adminExtensionsGiven,

    healthScore,
    healthLabel,
    healthColor,
    churnRisk,
    suggestedAction,

    patientsAllTime,
    patientsLast30Days,
    avgPatientsPerDay,
    qrAdoptionRate,
    qrCheckInsLast30Days,
    manualCheckInsLast30Days,
    whatsappCheckInsLast30Days,
    avgWaitTimeMinutes,
    avgWaitTimeChangeVsLastWeek,
    avgConsultationMinutes,
    avgConsultationConfigured: clinic.avgConsultationMins,
    noShowRate,
    peakHourRange,
    lastLoginAt: clinic.lastLoginAt?.toISOString() ?? null,
    lastActiveDaysAgo,

    notifyAtPosition: clinic.notifyAtPosition,
    qrCodeActive,
    qrCodeLastScannedAt,
    isActive: clinic.isActive,

    onboardingStep: clinic.onboardingStep,
    onboardingTotalSteps: 4,
    onboardingStepLabel: ONBOARDING_STEP_LABELS[clinic.onboardingStep] || 'Unknown',
    onboardingComplete: clinic.onboardingCompleted,

    todayActivity: {
      waiting: todayWaiting,
      inConsultation: todayInConsultation,
      completed: todayCompleted,
      noShows: todayNoShows,
      cancelled: todayCancelled,
      avgWaitMinutesToday,
      qrCheckInsToday: todayQrCheckIns,
      totalCheckInsToday: todayEntries.length,
      peakHourToday,
      dayLabel,
    },
    typicalActivity,

    weeklyChartData: {
      days: weekDays,
      thisWeekTotal,
      lastWeekTotal,
      weekOnWeekChangePct,
      bestDayLabel,
      avgWaitThisWeek,
    },
    monthlyChartData: {
      days: monthlyDays,
      peakDayLabel,
      activeDays,
      zeroDays,
      avgPerActiveDay,
    },
    methodChartData: {
      manual: manualCheckInsLast30Days,
      qr: qrCheckInsLast30Days,
      whatsapp: whatsappCheckInsLast30Days,
      totalLast30Days: patientsLast30Days,
      qrGrowing,
      qrGrowthNote,
    },

    timeline,
    recentPatients,
  };
}

// ─── V3: Redesigned Summary Interfaces ──────────────────────

export interface ClinicSummary {
  id: string;
  name: string;
  doctorEmail: string;
  plan: 'TRIAL' | 'PAID' | 'CHURNED';
  trialEndsAt: string | null;
  joinedAt: string;
  lastActiveAt: string | null;
  lastActiveDaysAgo: number | null;
  patientsLast30Days: number;
  avgPatientsPerDay: number;
  qrCheckInCount30d: number;
  totalCheckInCount30d: number;
  qrAdoptionRate: number;
  healthScore: 1 | 2 | 3 | 4;
  healthLabel: 'Strong' | 'Good' | 'Fair' | 'Weak';
  healthColor: 'green' | 'orange' | 'red';
  churnRisk: 'high' | 'medium' | 'low' | 'none';
  isInternal: boolean;
  isActive: boolean;
  sessionHistory: number[];
  daysUntilTrialExpires: number | null;
}

export interface FinancialSummary {
  currentMrr: number;
  activeTrials: number;
  trialsExpiringSoon: number;
  trialsExpiringThisWeek: number;
  highIntentTrials: number;
  atRiskTrials: number;
  projectedMrrBestCase: number;
  projectedMrrLikely: number;
  projectedMrrConservative: number;
  arpu: number;
  conversionPipeline: ClinicSummary[];
  revenueHistory: Array<{ month: string; totalMrr: number; newMrr: number; churnedMrr: number; net: number }>;
}

export interface EngagementSummary {
  totalCheckIns30d: number;
  qrCheckIns30d: number;
  manualCheckIns30d: number;
  whatsappCheckIns30d: number;
  qrAdoptionRate: number;
  avgPatientsPerClinicPerDay: number;
  multiDoctorClinicsCount: number;
  onboardingFunnel: {
    signedUp: number;
    clinicSetup: number;
    qrCodeGenerated: number;
    firstPatientCheckedIn: number;
    firstQrScan: number;
  };
  clinicBreakdown: ClinicSummary[];
  recommendedActions: Array<{ priority: number; color: 'green' | 'orange' | 'gray'; title: string; meta: string }>;
  peakCheckinHour: string;
}

// ─── V3: getClinicsSummary ──────────────────────────────────

export async function getClinicsSummary(): Promise<ClinicSummary[]> {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Query all clinics with countryFilter
  const clinics = await prisma.clinic.findMany({
    where: { ...countryFilter },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      createdAt: true,
      lastLoginAt: true,
      isActive: true,
    },
  });

  // 2. Single groupBy query for all clinics' 30d check-in counts by method
  const checkinGroups = await prisma.queueEntry.groupBy({
    by: ['clinicId', 'checkInMethod'],
    where: { arrivedAt: { gte: thirtyDaysAgo }, ...clinicCountryFilter },
    _count: true,
  });

  // Build per-clinic check-in maps
  const clinicCheckinMap = new Map<string, { qr: number; total: number }>();
  for (const g of checkinGroups) {
    const existing = clinicCheckinMap.get(g.clinicId) || { qr: 0, total: 0 };
    existing.total += g._count;
    if (g.checkInMethod === 'QR_CODE') {
      existing.qr += g._count;
    }
    clinicCheckinMap.set(g.clinicId, existing);
  }

  // 3. Session history: for each clinic, get last 14 distinct dates with counts
  // Use a single query to get all entries grouped by clinicId and date
  const recentEntries = await prisma.queueEntry.findMany({
    where: { ...clinicCountryFilter },
    select: { clinicId: true, arrivedAt: true },
    orderBy: { arrivedAt: 'desc' },
  });

  // Build per-clinic date->count map
  const clinicDateMap = new Map<string, Map<string, number>>();
  for (const entry of recentEntries) {
    const dateKey = entry.arrivedAt.toISOString().split('T')[0];
    if (!clinicDateMap.has(entry.clinicId)) {
      clinicDateMap.set(entry.clinicId, new Map());
    }
    const dateMap = clinicDateMap.get(entry.clinicId)!;
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
  }

  // Admin emails for isInternal check (lowercase)
  const adminEmailsLower = brand.adminEmails.map(e => e.toLowerCase());

  // 4. Build ClinicSummary for each clinic
  return clinics.map((clinic) => {
    const checkins = clinicCheckinMap.get(clinic.id) || { qr: 0, total: 0 };
    const patientsLast30Days = checkins.total;
    const avgPatientsPerDay = Math.round((patientsLast30Days / 30) * 10) / 10;
    const qrAdoptionRate = checkins.total > 0
      ? Math.round((checkins.qr / checkins.total) * 100)
      : 0;

    // Plan classification
    let plan: 'TRIAL' | 'PAID' | 'CHURNED';
    if (clinic.subscriptionStatus === 'TRIAL') {
      plan = 'TRIAL';
    } else if (clinic.subscriptionStatus === 'ACTIVE') {
      plan = 'PAID';
    } else {
      plan = 'CHURNED';
    }

    // lastActiveDaysAgo
    const lastActiveDaysAgo = clinic.lastLoginAt
      ? Math.floor((now.getTime() - clinic.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Health score: +2 if patients>=20 (+1 if >=5), +1 if qrRate>=20%, +1 if lastActive<=2d
    let score = 0;
    if (patientsLast30Days >= 20) {
      score += 2;
    } else if (patientsLast30Days >= 5) {
      score += 1;
    }
    if (qrAdoptionRate >= 20) {
      score += 1;
    }
    if (lastActiveDaysAgo !== null && lastActiveDaysAgo <= 2) {
      score += 1;
    }
    const healthScore = Math.max(1, Math.min(4, score)) as 1 | 2 | 3 | 4;

    // Health label/color mapping
    const healthMap: Record<number, { label: 'Strong' | 'Good' | 'Fair' | 'Weak'; color: 'green' | 'orange' | 'red' }> = {
      4: { label: 'Strong', color: 'green' },
      3: { label: 'Good', color: 'orange' },
      2: { label: 'Fair', color: 'orange' },
      1: { label: 'Weak', color: 'red' },
    };
    const { label: healthLabel, color: healthColor } = healthMap[healthScore];

    // isInternal
    const isInternal = adminEmailsLower.includes(clinic.email.toLowerCase());

    // Churn risk
    let churnRisk: 'high' | 'medium' | 'low' | 'none';
    if (isInternal) {
      churnRisk = 'none';
    } else if (lastActiveDaysAgo !== null && lastActiveDaysAgo >= 10 && patientsLast30Days < 5) {
      churnRisk = 'high';
    } else if (checkins.qr === 0 || patientsLast30Days < 10) {
      churnRisk = 'medium';
    } else if (healthScore >= 3) {
      churnRisk = 'low';
    } else {
      churnRisk = 'medium';
    }

    // Session history: last 14 distinct dates, return counts as array
    const dateMap = clinicDateMap.get(clinic.id) || new Map();
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0])) // desc
      .slice(0, 14)
      .reverse(); // oldest first
    const sessionHistory = sortedDates.map(([, count]) => count);

    // Days until trial expires
    let daysUntilTrialExpires: number | null = null;
    if (clinic.trialEndsAt) {
      daysUntilTrialExpires = Math.ceil(
        (clinic.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      id: clinic.id,
      name: clinic.name,
      doctorEmail: clinic.email,
      plan,
      trialEndsAt: clinic.trialEndsAt?.toISOString() ?? null,
      joinedAt: clinic.createdAt.toISOString(),
      lastActiveAt: clinic.lastLoginAt?.toISOString() ?? null,
      lastActiveDaysAgo,
      patientsLast30Days,
      avgPatientsPerDay,
      qrCheckInCount30d: checkins.qr,
      totalCheckInCount30d: checkins.total,
      qrAdoptionRate,
      healthScore,
      healthLabel,
      healthColor,
      churnRisk,
      isInternal,
      isActive: clinic.isActive,
      sessionHistory,
      daysUntilTrialExpires,
    };
  });
}

// ─── V3: getFinancialSummary ────────────────────────────────

export async function getFinancialSummary(): Promise<FinancialSummary> {
  // 1. Get clinic data
  const clinicsSummary = await getClinicsSummary();

  // 2. Compute MRR from active subscriptions (reuse pattern from getFinancialAnalytics)
  const planCounts = await prisma.clinic.groupBy({
    by: ['subscriptionPlan'],
    where: { subscriptionStatus: 'ACTIVE', ...countryFilter },
    _count: true,
  });
  const pMap: Record<string, number> = {};
  for (const g of planCounts) { pMap[g.subscriptionPlan || ''] = g._count; }
  const monthlyMajor = brand.pricing.monthly / brand.currency.multiplier;
  const yearlyMajor = brand.pricing.yearly / brand.currency.multiplier;
  const currentMrr = ((pMap['MONTHLY'] || 0) * monthlyMajor) + Math.round((pMap['YEARLY'] || 0) * (yearlyMajor / 12));

  // 3. ARPU hardcoded
  const arpu = 60;

  // 4. Filter/count trials
  const trialClinics = clinicsSummary.filter(c => c.plan === 'TRIAL');
  const activeTrials = trialClinics.length;
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const trialsExpiringSoon = trialClinics.filter(c =>
    c.daysUntilTrialExpires !== null && c.daysUntilTrialExpires > 0 && c.daysUntilTrialExpires <= 14
  ).length;

  const trialsExpiringThisWeek = trialClinics.filter(c =>
    c.daysUntilTrialExpires !== null && c.daysUntilTrialExpires > 0 && c.daysUntilTrialExpires <= 7
  ).length;

  // High-intent: healthScore >= 3 AND not internal
  const highIntentTrials = trialClinics.filter(c => c.healthScore >= 3 && !c.isInternal).length;

  // At-risk: churnRisk === 'high'
  const atRiskTrials = trialClinics.filter(c => c.churnRisk === 'high').length;

  // 5. Projected MRR
  const projectedMrrBestCase = currentMrr + activeTrials * arpu;
  const projectedMrrLikely = currentMrr + highIntentTrials * arpu;
  const projectedMrrConservative = currentMrr + Math.min(1, highIntentTrials) * arpu;

  // 6. Conversion pipeline: trial clinics sorted by healthScore DESC, then daysUntilTrialExpires ASC
  const conversionPipeline = [...trialClinics].sort((a, b) => {
    if (b.healthScore !== a.healthScore) return b.healthScore - a.healthScore;
    const aDays = a.daysUntilTrialExpires ?? Infinity;
    const bDays = b.daysUntilTrialExpires ?? Infinity;
    return aDays - bDays;
  });

  // 7. Revenue history: reuse PaymentRecord + SubscriptionEvent aggregation
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const payments = await prisma.paymentRecord.findMany({
    where: { month: { gte: twelveMonthsAgo }, status: 'paid', ...clinicCountryFilter },
    select: { amount: true, month: true },
  });

  const subEvents = await prisma.subscriptionEvent.findMany({
    where: { createdAt: { gte: twelveMonthsAgo }, ...clinicCountryFilter },
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

  payments.forEach((p) => {
    const monthKey = p.month.toISOString().slice(0, 7);
    const entry = mrrHistoryMap.get(monthKey);
    if (entry) {
      entry.totalMrr += Math.round(p.amount / brand.currency.multiplier);
    }
  });

  const finMonthlyMajor = brand.pricing.monthly / brand.currency.multiplier;
  subEvents.forEach((event) => {
    const monthKey = event.createdAt.toISOString().slice(0, 7);
    const entry = mrrHistoryMap.get(monthKey);
    if (!entry) return;
    const amountMajor = event.amount ? Math.round(event.amount / brand.currency.multiplier) : finMonthlyMajor;
    if (event.eventType === 'payment_success') {
      entry.newMrr += amountMajor;
    } else if (event.eventType === 'subscription_expired' || event.eventType === 'subscription_cancelled' || event.eventType === 'trial_expired') {
      entry.churnedMrr += finMonthlyMajor;
    }
  });

  const revenueHistory = Array.from(mrrHistoryMap.entries())
    .map(([month, data]) => ({
      month,
      totalMrr: data.totalMrr,
      newMrr: data.newMrr,
      churnedMrr: data.churnedMrr,
      net: data.totalMrr + data.newMrr - data.churnedMrr,
    }))
    .reverse();

  return {
    currentMrr,
    activeTrials,
    trialsExpiringSoon,
    trialsExpiringThisWeek,
    highIntentTrials,
    atRiskTrials,
    projectedMrrBestCase,
    projectedMrrLikely,
    projectedMrrConservative,
    arpu,
    conversionPipeline,
    revenueHistory,
  };
}

// ─── V3: getEngagementSummary ───────────────────────────────

export async function getEngagementSummary(): Promise<EngagementSummary> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // 1. Get clinic data
  const clinicsSummary = await getClinicsSummary();

  // 2. Aggregate check-in counts from 30d (reuse pattern from getFeatureAdoption)
  const checkinGroups = await prisma.queueEntry.groupBy({
    by: ['checkInMethod'],
    where: { arrivedAt: { gte: thirtyDaysAgo }, ...clinicCountryFilter },
    _count: true,
  });
  const cMap: Record<string, number> = {};
  for (const g of checkinGroups) { cMap[g.checkInMethod || ''] = g._count; }
  const qrCheckIns30d = cMap['QR_CODE'] || 0;
  const manualCheckIns30d = cMap['MANUAL'] || 0;
  const whatsappCheckIns30d = cMap['WHATSAPP'] || 0;
  const totalCheckIns30d = Object.values(cMap).reduce((a, b) => a + b, 0);
  const qrAdoptionRate = totalCheckIns30d > 0
    ? Math.round((qrCheckIns30d / totalCheckIns30d) * 100)
    : 0;

  // Avg patients per clinic per day
  const activeClinics = await prisma.clinic.count({ where: { isActive: true, ...countryFilter } });
  const avgPatientsPerClinicPerDay = activeClinics > 0 && totalCheckIns30d > 0
    ? Math.round((totalCheckIns30d / 30 / activeClinics) * 10) / 10
    : 0;

  // 3. Multi-doctor count
  const clinicsWithDoctors = await prisma.doctor.findMany({
    where: { isActive: true, ...clinicCountryFilter },
    select: { clinicId: true },
    distinct: ['clinicId'],
  });
  const multiDoctorClinicsCount = clinicsWithDoctors.length;

  // 4. Onboarding funnel
  const totalClinics = clinicsSummary.length;
  const clinicSetup = await prisma.clinic.count({ where: { onboardingStep: { gte: 1 }, ...countryFilter } });
  const qrCodeGenerated = await prisma.clinic.count({ where: { onboardingStep: { gte: 2 }, ...countryFilter } });

  // Clinics that have >= 1 QueueEntry ever
  const clinicsWithPatients = await prisma.queueEntry.findMany({
    select: { clinicId: true },
    distinct: ['clinicId'],
    where: { ...clinicCountryFilter },
  });
  const firstPatientCheckedIn = clinicsWithPatients.length;

  // Clinics that have >= 1 QueueEntry with checkInMethod='QR_CODE' ever
  const clinicsWithQr = await prisma.queueEntry.findMany({
    select: { clinicId: true },
    distinct: ['clinicId'],
    where: { checkInMethod: 'QR_CODE', ...clinicCountryFilter },
  });
  const firstQrScan = clinicsWithQr.length;

  const onboardingFunnel = {
    signedUp: totalClinics,
    clinicSetup,
    qrCodeGenerated,
    firstPatientCheckedIn,
    firstQrScan,
  };

  // 5. Recommended actions
  const recommendedActions: Array<{ priority: number; color: 'green' | 'orange' | 'gray'; title: string; meta: string }> = [];

  // 5a. Highest-health trial expiring soonest
  const highHealthTrials = clinicsSummary
    .filter(c => c.plan === 'TRIAL' && c.healthScore >= 3 && !c.isInternal && c.daysUntilTrialExpires !== null && c.daysUntilTrialExpires > 0)
    .sort((a, b) => (a.daysUntilTrialExpires ?? Infinity) - (b.daysUntilTrialExpires ?? Infinity));
  if (highHealthTrials.length > 0) {
    const top = highHealthTrials[0];
    recommendedActions.push({
      priority: 1,
      color: 'green',
      title: `Contact ${top.name} this week — convert to paid`,
      meta: `Health: ${top.healthLabel}, Trial expires in ${top.daysUntilTrialExpires}d`,
    });
  }

  // 5b. Clinics with qrAdoptionRate < 5
  const lowQrClinics = clinicsSummary.filter(c => c.qrAdoptionRate < 5 && c.totalCheckInCount30d > 0 && !c.isInternal);
  if (lowQrClinics.length > 0 && recommendedActions.length < 5) {
    recommendedActions.push({
      priority: 2,
      color: 'orange',
      title: `Send QR Setup Guide to ${lowQrClinics.length} clinic(s)`,
      meta: `These clinics have < 5% QR adoption`,
    });
  }

  // 5c. Dormant clinics (lastActiveDaysAgo >= 10, not internal)
  const dormantClinics = clinicsSummary.filter(c => c.lastActiveDaysAgo !== null && c.lastActiveDaysAgo >= 10 && !c.isInternal);
  for (const dormant of dormantClinics) {
    if (recommendedActions.length >= 5) break;
    recommendedActions.push({
      priority: 3,
      color: 'orange',
      title: `Re-engage ${dormant.name}`,
      meta: `Last active ${dormant.lastActiveDaysAgo} days ago`,
    });
  }

  // 5d. Low avg patients per day
  if (avgPatientsPerClinicPerDay < 10 && recommendedActions.length < 5) {
    recommendedActions.push({
      priority: 4,
      color: 'gray',
      title: `Investigate why Avg Patients/Day is low`,
      meta: `Current: ${avgPatientsPerClinicPerDay} patients/clinic/day`,
    });
  }

  // 5e. Clinics with 0 patients
  const zeroPatientsCount = clinicsSummary.filter(c => c.patientsLast30Days === 0 && !c.isInternal).length;
  if (zeroPatientsCount > 0 && recommendedActions.length < 5) {
    recommendedActions.push({
      priority: 5,
      color: 'gray',
      title: `${zeroPatientsCount} clinic(s) haven't processed any patients`,
      meta: `No check-ins in the last 30 days`,
    });
  }

  // Cap at 5
  recommendedActions.splice(5);

  // 6. Peak check-in hour
  const recentCheckins = await prisma.queueEntry.findMany({
    where: { arrivedAt: { gte: thirtyDaysAgo }, ...clinicCountryFilter },
    select: { arrivedAt: true },
  });

  const hourCounts = new Map<number, number>();
  for (const entry of recentCheckins) {
    const hour = entry.arrivedAt.getUTCHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }

  let peakHour = 9; // default
  let peakCount = 0;
  for (const [hour, count] of hourCounts.entries()) {
    if (count > peakCount) {
      peakCount = count;
      peakHour = hour;
    }
  }
  const peakCheckinHour = `${String(peakHour).padStart(2, '0')}:00`;

  // 7. Clinic breakdown sorted by patientsLast30Days DESC
  const clinicBreakdown = [...clinicsSummary].sort((a, b) => b.patientsLast30Days - a.patientsLast30Days);

  return {
    totalCheckIns30d,
    qrCheckIns30d,
    manualCheckIns30d,
    whatsappCheckIns30d,
    qrAdoptionRate,
    avgPatientsPerClinicPerDay,
    multiDoctorClinicsCount,
    onboardingFunnel,
    clinicBreakdown,
    recommendedActions,
    peakCheckinHour,
  };
}
