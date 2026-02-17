/**
 * Admin Test Seed Data
 *
 * Creates 10 realistic clinics (5 TN + 5 FR) with staggered creation dates,
 * growing daily stats, live queue entries, payment records, and subscription events.
 *
 * Usage:
 *   npx tsx prisma/seed-admin-test.ts          # Add test data
 *   npx tsx prisma/seed-admin-test.ts --delete  # Remove test data
 *
 * All test clinics use seed-*@testclinic.{tn,fr} emails for easy identification.
 * Password for all test clinics: SeedTest2024!
 */

import {
  PrismaClient,
  QueueStatus,
  CheckInMethod,
  SubscriptionStatus,
  SubscriptionPlan,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Deterministic PRNG (Mulberry32) for reproducible data ───────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const TEST_EMAIL_PATTERN = '@testclinic.';
const PASSWORD = 'SeedTest2024!';
const NOW = new Date();

function daysAgo(n: number): Date {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateOnly(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// ─── Name pools ──────────────────────────────────────────────────────────────
const TN_FIRST = [
  'Mohamed', 'Fatma', 'Ali', 'Sana', 'Youssef', 'Amira', 'Karim', 'Leila',
  'Nizar', 'Rania', 'Hedi', 'Ines', 'Mehdi', 'Mariam', 'Amine', 'Salma',
  'Khaled', 'Nour', 'Tarek', 'Dorra',
];
const TN_LAST = [
  'Trabelsi', 'Ben Amor', 'Jebali', 'Sassi', 'Khalil', 'Mansour',
  'Chaabane', 'Hamdi', 'Bouaziz', 'Karoui', 'Gharbi', 'Mrad', 'Rezgui',
  'Belhaj', 'Ayari',
];
const FR_FIRST = [
  'Pierre', 'Marie', 'Jean', 'Sophie', 'Thomas', 'Claire', 'Nicolas',
  'Camille', 'Antoine', 'Julie', 'Lucas', 'Emma', 'Hugo', 'Lea', 'Louis',
  'Chloe', 'Raphael', 'Alice', 'Arthur', 'Manon',
];
const FR_LAST = [
  'Dupont', 'Martin', 'Laurent', 'Moreau', 'Bernard', 'Petit', 'Robert',
  'Richard', 'Durand', 'Leroy', 'Simon', 'Michel', 'Garcia', 'David',
  'Bertrand',
];

function randomTnPhone(): string {
  return `+2169${String(randInt(1000000, 9999999))}`;
}
function randomFrPhone(): string {
  return `+336${String(randInt(10000000, 99999999))}`;
}

// ─── Clinic definitions ──────────────────────────────────────────────────────
interface ClinicDef {
  email: string;
  name: string;
  doctorName: string;
  doctorGender: string;
  specialty: string;
  country: 'TN' | 'FR';
  phone: string;
  address: string;
  capacity: number;
  createdDaysAgo: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan: SubscriptionPlan | null;
  onboardingStep: number;
  onboardingCompleted: boolean;
  lastLoginDaysAgo: number;
  extraDoctors?: { name: string; specialty: string; avgMins: number }[];
}

const CLINICS: ClinicDef[] = [
  // ── Tunisia (BleSaf) ──────────────────────────────────────────────────────
  {
    email: 'seed-bouaziz@testclinic.tn',
    name: 'Cabinet Dr. Mehdi Bouaziz',
    doctorName: 'Dr. Mehdi Bouaziz',
    doctorGender: 'M',
    specialty: 'general',
    country: 'TN',
    phone: '+21671234001',
    address: 'Avenue Habib Bourguiba, Tunis',
    capacity: 35,
    createdDaysAgo: 21,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.MONTHLY,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 0,
    extraDoctors: [
      { name: 'Dr. Rania Mrad', specialty: 'general', avgMins: 12 },
      { name: 'Dr. Hedi Gharbi', specialty: 'internal_medicine', avgMins: 18 },
    ],
  },
  {
    email: 'seed-trabelsi@testclinic.tn',
    name: 'Cabinet Dr. Leila Trabelsi',
    doctorName: 'Dr. Leila Trabelsi',
    doctorGender: 'F',
    specialty: 'ophthalmology',
    country: 'TN',
    phone: '+21671234002',
    address: 'Rue de Marseille, Tunis',
    capacity: 20,
    createdDaysAgo: 14,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.YEARLY,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 1,
  },
  {
    email: 'seed-jebali@testclinic.tn',
    name: 'Cabinet Dr. Karim Jebali',
    doctorName: 'Dr. Karim Jebali',
    doctorGender: 'M',
    specialty: 'dentistry',
    country: 'TN',
    phone: '+21671234003',
    address: 'Avenue de la Liberte, Sfax',
    capacity: 12,
    createdDaysAgo: 10,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    subscriptionPlan: null,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 0,
  },
  {
    email: 'seed-hamdi@testclinic.tn',
    name: 'Cabinet Dr. Sana Hamdi',
    doctorName: 'Dr. Sana Hamdi',
    doctorGender: 'F',
    specialty: 'pediatrics',
    country: 'TN',
    phone: '+21671234004',
    address: 'Rue Ibn Khaldoun, Sousse',
    capacity: 25,
    createdDaysAgo: 5,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    subscriptionPlan: null,
    onboardingStep: 2,
    onboardingCompleted: false,
    lastLoginDaysAgo: 1,
  },
  {
    email: 'seed-chaabane@testclinic.tn',
    name: 'Cabinet Dr. Nizar Chaabane',
    doctorName: 'Dr. Nizar Chaabane',
    doctorGender: 'M',
    specialty: 'cardiology',
    country: 'TN',
    phone: '+21671234005',
    address: 'Avenue Mohamed V, Monastir',
    capacity: 8,
    createdDaysAgo: 21,
    subscriptionStatus: SubscriptionStatus.EXPIRED,
    subscriptionPlan: null,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 12,
  },

  // ── France (AuSuivant) ────────────────────────────────────────────────────
  {
    email: 'seed-dupont@testclinic.fr',
    name: 'Cabinet Dr. Marie Dupont',
    doctorName: 'Dr. Marie Dupont',
    doctorGender: 'F',
    specialty: 'general',
    country: 'FR',
    phone: '+33612340001',
    address: '15 Rue de Rivoli, Paris',
    capacity: 40,
    createdDaysAgo: 21,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.MONTHLY,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 0,
    extraDoctors: [
      { name: 'Dr. Thomas Petit', specialty: 'general', avgMins: 15 },
      { name: 'Dr. Camille Robert', specialty: 'general', avgMins: 12 },
    ],
  },
  {
    email: 'seed-martin@testclinic.fr',
    name: 'Cabinet Dr. Pierre Martin',
    doctorName: 'Dr. Pierre Martin',
    doctorGender: 'M',
    specialty: 'dermatology',
    country: 'FR',
    phone: '+33612340002',
    address: '8 Boulevard Saint-Germain, Paris',
    capacity: 18,
    createdDaysAgo: 14,
    subscriptionStatus: SubscriptionStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.YEARLY,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 2,
  },
  {
    email: 'seed-laurent@testclinic.fr',
    name: 'Cabinet Dr. Sophie Laurent',
    doctorName: 'Dr. Sophie Laurent',
    doctorGender: 'F',
    specialty: 'pediatrics',
    country: 'FR',
    phone: '+33612340003',
    address: '22 Avenue Victor Hugo, Lyon',
    capacity: 22,
    createdDaysAgo: 12,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    subscriptionPlan: null,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 0,
  },
  {
    email: 'seed-moreau@testclinic.fr',
    name: 'Cabinet Dr. Jean Moreau',
    doctorName: 'Dr. Jean Moreau',
    doctorGender: 'M',
    specialty: 'ophthalmology',
    country: 'FR',
    phone: '+33612340004',
    address: '5 Place Bellecour, Lyon',
    capacity: 10,
    createdDaysAgo: 6,
    subscriptionStatus: SubscriptionStatus.TRIAL,
    subscriptionPlan: null,
    onboardingStep: 1,
    onboardingCompleted: false,
    lastLoginDaysAgo: 3,
  },
  {
    email: 'seed-bernard@testclinic.fr',
    name: 'Cabinet Dr. Claire Bernard',
    doctorName: 'Dr. Claire Bernard',
    doctorGender: 'F',
    specialty: 'dentistry',
    country: 'FR',
    phone: '+33612340005',
    address: '12 Rue de la Paix, Marseille',
    capacity: 30,
    createdDaysAgo: 21,
    subscriptionStatus: SubscriptionStatus.PAST_DUE,
    subscriptionPlan: SubscriptionPlan.MONTHLY,
    onboardingStep: 3,
    onboardingCompleted: true,
    lastLoginDaysAgo: 8,
    extraDoctors: [
      { name: 'Dr. Nicolas Durand', specialty: 'dentistry', avgMins: 20 },
    ],
  },
];

// ─── Growth curve ────────────────────────────────────────────────────────────
function dailyPatients(dayIndex: number, capacity: number): number {
  const growthFactor = Math.min(1, dayIndex / 8);
  const baseRate = 0.15 + 0.7 * growthFactor;
  const noise = 0.85 + rand() * 0.3;
  return Math.max(1, Math.round(capacity * baseRate * noise));
}

// ─── Check-in method pool (50% QR, 30% Manual, 20% WhatsApp) ────────────────
const CHECK_IN_POOL: CheckInMethod[] = [
  CheckInMethod.QR_CODE,
  CheckInMethod.QR_CODE,
  CheckInMethod.QR_CODE,
  CheckInMethod.QR_CODE,
  CheckInMethod.QR_CODE,
  CheckInMethod.MANUAL,
  CheckInMethod.MANUAL,
  CheckInMethod.MANUAL,
  CheckInMethod.WHATSAPP,
  CheckInMethod.WHATSAPP,
];

// ─── SEED ────────────────────────────────────────────────────────────────────
async function seedAdminTestData() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  let totalClinics = 0;
  let totalDoctors = 0;
  let totalStats = 0;
  let totalQueue = 0;
  let totalPayments = 0;
  let totalEvents = 0;

  for (const def of CLINICS) {
    const createdAt = daysAgo(def.createdDaysAgo);
    const trialEndsAt = new Date(createdAt);
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    // Subscription end date
    let subscriptionEndsAt: Date | null = null;
    if (def.subscriptionPlan === SubscriptionPlan.MONTHLY) {
      subscriptionEndsAt = new Date(NOW);
      if (def.subscriptionStatus === SubscriptionStatus.ACTIVE) {
        subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 15);
      } else if (def.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
        subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() - 3);
      }
    } else if (def.subscriptionPlan === SubscriptionPlan.YEARLY) {
      subscriptionEndsAt = new Date(createdAt);
      subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
    }

    // Last login
    const lastLoginAt = new Date(NOW);
    lastLoginAt.setDate(lastLoginAt.getDate() - def.lastLoginDaysAgo);
    lastLoginAt.setHours(randInt(8, 18), randInt(0, 59), 0, 0);

    // ── Create clinic ────────────────────────────────────────────────────
    const clinic = await prisma.clinic.create({
      data: {
        name: def.name,
        doctorName: def.doctorName,
        doctorGender: def.doctorGender,
        email: def.email,
        passwordHash,
        emailVerified: true,
        phone: def.phone,
        address: def.address,
        language: 'fr',
        country: def.country,
        specialty: def.specialty,
        avgConsultationMins: randInt(8, 20),
        notifyAtPosition: 2,
        enableWhatsApp: rand() > 0.5,
        businessType: 'medical',
        isActive: def.subscriptionStatus !== SubscriptionStatus.EXPIRED,
        isDoctorPresent: def.lastLoginDaysAgo <= 1,
        onboardingCompleted: def.onboardingCompleted,
        onboardingStep: def.onboardingStep,
        subscriptionStatus: def.subscriptionStatus,
        subscriptionPlan: def.subscriptionPlan,
        trialEndsAt,
        subscriptionEndsAt,
        lastLoginAt,
        createdAt,
      },
    });
    totalClinics++;
    console.log(
      `  ✅ ${def.name} (${def.country}, ${def.subscriptionStatus}, ${def.capacity} cap)`
    );

    // ── Create doctors ───────────────────────────────────────────────────
    const doctorIds: string[] = [];

    const mainDoc = await prisma.doctor.create({
      data: {
        clinicId: clinic.id,
        name: def.doctorName,
        specialty: def.specialty,
        avgConsultationMins: randInt(10, 20),
      },
    });
    doctorIds.push(mainDoc.id);
    totalDoctors++;

    if (def.extraDoctors) {
      for (const ed of def.extraDoctors) {
        const doc = await prisma.doctor.create({
          data: {
            clinicId: clinic.id,
            name: ed.name,
            specialty: ed.specialty,
            avgConsultationMins: ed.avgMins,
          },
        });
        doctorIds.push(doc.id);
        totalDoctors++;
      }
    }

    // ── DailyStats (creation day → yesterday) ────────────────────────────
    const yesterday = dateOnly(daysAgo(1));

    for (let dayOffset = 0; ; dayOffset++) {
      const statDate = new Date(createdAt);
      statDate.setDate(statDate.getDate() + dayOffset);
      statDate.setHours(0, 0, 0, 0);

      if (statDate > yesterday) break;

      const patients = dailyPatients(dayOffset, def.capacity);
      const avgWait = 15 + Math.round(patients * 1.2 + rand() * 10);
      const avgConsult = randInt(8, 25);
      const noShows = Math.max(0, Math.round(patients * (0.04 + rand() * 0.08)));

      await prisma.dailyStat.create({
        data: {
          clinicId: clinic.id,
          date: statDate,
          totalPatients: patients,
          avgWaitMins: avgWait,
          avgConsultationMins: avgConsult,
          noShows,
        },
      });
      totalStats++;
    }

    // ── Today's QueueEntries (active clinics only) ───────────────────────
    const isClinicActive =
      def.subscriptionStatus !== SubscriptionStatus.EXPIRED &&
      def.lastLoginDaysAgo <= 2;

    if (isClinicActive) {
      const isTN = def.country === 'TN';
      const firstNames = isTN ? TN_FIRST : FR_FIRST;
      const lastNames = isTN ? TN_LAST : FR_LAST;
      const phoneGen = isTN ? randomTnPhone : randomFrPhone;

      const numCompleted = randInt(1, 3);
      const numNoShow = rand() > 0.6 ? 1 : 0;

      // Completed patients (earlier in the morning)
      for (let i = 0; i < numCompleted; i++) {
        const arrivedMinsAgo = 180 + randInt(0, 60);
        const arrivedAt = new Date(NOW.getTime() - arrivedMinsAgo * 60_000);
        const calledAt = new Date(
          arrivedAt.getTime() + randInt(20, 60) * 60_000
        );
        const completedAt = new Date(
          calledAt.getTime() + randInt(8, 25) * 60_000
        );

        await prisma.queueEntry.create({
          data: {
            clinicId: clinic.id,
            doctorId: pick(doctorIds),
            patientName: `${pick(firstNames)} ${pick(lastNames)}`,
            patientPhone: phoneGen(),
            position: 0,
            status: QueueStatus.COMPLETED,
            checkInMethod: pick(CHECK_IN_POOL),
            arrivedAt,
            calledAt,
            completedAt,
          },
        });
        totalQueue++;
      }

      // No-shows
      for (let i = 0; i < numNoShow; i++) {
        const arrivedMinsAgo = 150 + randInt(0, 30);
        const arrivedAt = new Date(NOW.getTime() - arrivedMinsAgo * 60_000);

        await prisma.queueEntry.create({
          data: {
            clinicId: clinic.id,
            doctorId: pick(doctorIds),
            patientName: `${pick(firstNames)} ${pick(lastNames)}`,
            patientPhone: phoneGen(),
            position: 0,
            status: QueueStatus.NO_SHOW,
            checkInMethod: pick(CHECK_IN_POOL),
            arrivedAt,
          },
        });
        totalQueue++;
      }

      // IN_CONSULTATION (position 1)
      let position = 1;
      {
        const arrivedMinsAgo = 90 + randInt(0, 30);
        const calledMinsAgo = randInt(3, 10);
        await prisma.queueEntry.create({
          data: {
            clinicId: clinic.id,
            doctorId: pick(doctorIds),
            patientName: `${pick(firstNames)} ${pick(lastNames)}`,
            patientPhone: phoneGen(),
            position: position++,
            status: QueueStatus.IN_CONSULTATION,
            checkInMethod: pick(CHECK_IN_POOL),
            arrivedAt: new Date(NOW.getTime() - arrivedMinsAgo * 60_000),
            calledAt: new Date(NOW.getTime() - calledMinsAgo * 60_000),
          },
        });
        totalQueue++;
      }

      // NOTIFIED (position 2)
      {
        const arrivedMinsAgo = 70 + randInt(0, 20);
        const notifiedMinsAgo = randInt(1, 5);
        await prisma.queueEntry.create({
          data: {
            clinicId: clinic.id,
            doctorId: pick(doctorIds),
            patientName: `${pick(firstNames)} ${pick(lastNames)}`,
            patientPhone: phoneGen(),
            position: position++,
            status: QueueStatus.NOTIFIED,
            checkInMethod: pick(CHECK_IN_POOL),
            arrivedAt: new Date(NOW.getTime() - arrivedMinsAgo * 60_000),
            notifiedAt: new Date(NOW.getTime() - notifiedMinsAgo * 60_000),
          },
        });
        totalQueue++;
      }

      // WAITING (2–5 more patients)
      const numWaiting = randInt(2, 5);
      for (let i = 0; i < numWaiting; i++) {
        const arrivedMinsAgo = Math.max(5, 50 - i * 12 + randInt(0, 5));
        await prisma.queueEntry.create({
          data: {
            clinicId: clinic.id,
            doctorId: pick(doctorIds),
            patientName: `${pick(firstNames)} ${pick(lastNames)}`,
            patientPhone: phoneGen(),
            position: position++,
            status: QueueStatus.WAITING,
            checkInMethod: pick(CHECK_IN_POOL),
            arrivedAt: new Date(NOW.getTime() - arrivedMinsAgo * 60_000),
          },
        });
        totalQueue++;
      }
    }

    // ── PaymentRecords ───────────────────────────────────────────────────
    const isTN = def.country === 'TN';
    const monthlyAmt = isTN ? 65_000 : 4_900;
    const yearlyAmt = isTN ? 650_000 : 49_000;
    const adminEmail = isTN ? 'admin@blesaf.tn' : 'admin@filosoin.fr';

    if (
      def.subscriptionStatus === SubscriptionStatus.ACTIVE &&
      def.subscriptionPlan === SubscriptionPlan.MONTHLY
    ) {
      const numPayments = def.createdDaysAgo >= 14 ? 2 : 1;
      for (let i = 0; i < numPayments; i++) {
        const monthDate = new Date(NOW);
        monthDate.setMonth(monthDate.getMonth() - i);
        monthDate.setDate(1);
        monthDate.setHours(0, 0, 0, 0);

        const paidAt = new Date(monthDate);
        paidAt.setDate(randInt(1, 5));
        paidAt.setHours(randInt(9, 17), randInt(0, 59), 0, 0);

        await prisma.paymentRecord.create({
          data: {
            clinicId: clinic.id,
            amount: monthlyAmt,
            month: monthDate,
            method: i === 0 ? 'konnect' : pick(['bank_transfer', 'cash', 'konnect']),
            reference: `PAY-SEED-${clinic.id.slice(0, 8)}-${i}`,
            status: 'paid',
            paidAt,
            recordedBy: adminEmail,
          },
        });
        totalPayments++;
      }
    } else if (
      def.subscriptionStatus === SubscriptionStatus.ACTIVE &&
      def.subscriptionPlan === SubscriptionPlan.YEARLY
    ) {
      const monthDate = new Date(createdAt);
      monthDate.setDate(1);
      monthDate.setHours(0, 0, 0, 0);

      const paidAt = new Date(createdAt);
      paidAt.setDate(paidAt.getDate() + randInt(5, 10));
      paidAt.setHours(randInt(9, 17), randInt(0, 59), 0, 0);

      await prisma.paymentRecord.create({
        data: {
          clinicId: clinic.id,
          amount: yearlyAmt,
          month: monthDate,
          method: 'konnect',
          reference: `PAY-SEED-${clinic.id.slice(0, 8)}-yearly`,
          status: 'paid',
          paidAt,
          recordedBy: adminEmail,
        },
      });
      totalPayments++;
    } else if (def.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
      // One successful month, then a failed renewal
      const month1 = new Date(NOW);
      month1.setMonth(month1.getMonth() - 1);
      month1.setDate(1);
      month1.setHours(0, 0, 0, 0);

      await prisma.paymentRecord.create({
        data: {
          clinicId: clinic.id,
          amount: monthlyAmt,
          month: month1,
          method: 'konnect',
          reference: `PAY-SEED-${clinic.id.slice(0, 8)}-0`,
          status: 'paid',
          paidAt: new Date(month1.getTime() + 3 * 86_400_000),
          recordedBy: adminEmail,
        },
      });

      const month2 = new Date(NOW);
      month2.setDate(1);
      month2.setHours(0, 0, 0, 0);

      await prisma.paymentRecord.create({
        data: {
          clinicId: clinic.id,
          amount: monthlyAmt,
          month: month2,
          method: 'konnect',
          reference: `PAY-SEED-${clinic.id.slice(0, 8)}-1`,
          status: 'failed',
          paidAt: new Date(month2.getTime() + 2 * 86_400_000),
          recordedBy: adminEmail,
        },
      });
      totalPayments += 2;
    }

    // ── SubscriptionEvents ───────────────────────────────────────────────
    // All clinics: trial_started
    await prisma.subscriptionEvent.create({
      data: {
        clinicId: clinic.id,
        eventType: 'trial_started',
        notes: 'Auto-created on signup',
        createdAt,
      },
    });
    totalEvents++;

    if (def.subscriptionStatus === SubscriptionStatus.ACTIVE) {
      const activatedAt = new Date(createdAt);
      activatedAt.setDate(activatedAt.getDate() + randInt(7, 20));

      await prisma.subscriptionEvent.create({
        data: {
          clinicId: clinic.id,
          eventType: 'payment_success',
          amount:
            def.subscriptionPlan === SubscriptionPlan.YEARLY
              ? yearlyAmt
              : monthlyAmt,
          paymentRef: `PAY-SEED-${clinic.id.slice(0, 8)}`,
          createdAt: activatedAt,
        },
      });
      await prisma.subscriptionEvent.create({
        data: {
          clinicId: clinic.id,
          eventType: 'subscription_activated',
          notes: `Upgraded to ${def.subscriptionPlan}`,
          createdAt: new Date(activatedAt.getTime() + 1000),
        },
      });
      totalEvents += 2;
    } else if (def.subscriptionStatus === SubscriptionStatus.EXPIRED) {
      await prisma.subscriptionEvent.create({
        data: {
          clinicId: clinic.id,
          eventType: 'trial_expired',
          notes: 'Trial ended without conversion',
          createdAt: trialEndsAt,
        },
      });
      totalEvents++;
    } else if (def.subscriptionStatus === SubscriptionStatus.PAST_DUE) {
      const firstPayAt = new Date(createdAt);
      firstPayAt.setDate(firstPayAt.getDate() + randInt(10, 15));

      await prisma.subscriptionEvent.create({
        data: {
          clinicId: clinic.id,
          eventType: 'payment_success',
          amount: monthlyAmt,
          createdAt: firstPayAt,
        },
      });
      await prisma.subscriptionEvent.create({
        data: {
          clinicId: clinic.id,
          eventType: 'subscription_activated',
          createdAt: new Date(firstPayAt.getTime() + 1000),
        },
      });

      const failDate = new Date(NOW);
      failDate.setDate(failDate.getDate() - 3);
      await prisma.subscriptionEvent.create({
        data: {
          clinicId: clinic.id,
          eventType: 'payment_failed',
          notes: 'Payment failed - card declined',
          createdAt: failDate,
        },
      });
      totalEvents += 3;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Clinics:        ${totalClinics}`);
  console.log(`  Doctors:        ${totalDoctors}`);
  console.log(`  DailyStats:     ${totalStats}`);
  console.log(`  QueueEntries:   ${totalQueue}`);
  console.log(`  PaymentRecords: ${totalPayments}`);
  console.log(`  SubEvents:      ${totalEvents}`);
  console.log(`\n🔑 Password for all test clinics: ${PASSWORD}`);
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
async function deleteAdminTestData() {
  const testClinics = await prisma.clinic.findMany({
    where: { email: { contains: TEST_EMAIL_PATTERN } },
    select: { id: true, email: true, name: true },
  });

  if (testClinics.length === 0) {
    console.log('No test clinics found. Nothing to delete.');
    return;
  }

  console.log(`Found ${testClinics.length} test clinics to delete:`);
  for (const c of testClinics) {
    console.log(`  - ${c.name} (${c.email})`);
  }

  const ids = testClinics.map((c) => c.id);

  // Delete in dependency order (cascade would handle it, but being explicit)
  const events = await prisma.subscriptionEvent.deleteMany({
    where: { clinicId: { in: ids } },
  });
  const payments = await prisma.paymentRecord.deleteMany({
    where: { clinicId: { in: ids } },
  });
  const stats = await prisma.dailyStat.deleteMany({
    where: { clinicId: { in: ids } },
  });
  const queue = await prisma.queueEntry.deleteMany({
    where: { clinicId: { in: ids } },
  });
  const doctors = await prisma.doctor.deleteMany({
    where: { clinicId: { in: ids } },
  });
  const clinics = await prisma.clinic.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`\n✅ Deleted:`);
  console.log(`  Clinics:        ${clinics.count}`);
  console.log(`  Doctors:        ${doctors.count}`);
  console.log(`  DailyStats:     ${stats.count}`);
  console.log(`  QueueEntries:   ${queue.count}`);
  console.log(`  PaymentRecords: ${payments.count}`);
  console.log(`  SubEvents:      ${events.count}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────
const isDelete = process.argv.includes('--delete');

(async () => {
  if (isDelete) {
    console.log('🗑️  Deleting admin test data...\n');
    await deleteAdminTestData();
  } else {
    console.log('🌱 Seeding admin test data...\n');

    const existing = await prisma.clinic.count({
      where: { email: { contains: TEST_EMAIL_PATTERN } },
    });
    if (existing > 0) {
      console.log(
        `⚠️  Found ${existing} existing test clinic(s). Run with --delete first to clean up.`
      );
      process.exit(1);
    }

    await seedAdminTestData();
  }
})()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
