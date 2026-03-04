/**
 * Screenshot seed — inserts sample queue data for tutorial video screenshots.
 *
 * Usage:
 *   cd apps/api
 *   npx tsx prisma/seed-screenshot.ts            # Insert demo data
 *   npx tsx prisma/seed-screenshot.ts --cleanup   # Remove all demo data
 *
 * All demo entries use phone numbers starting with +21600DEMO so they can
 * be cleanly removed without affecting real data.
 */

import { PrismaClient, QueueStatus, CheckInMethod } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_PHONE_PREFIX = '+21600DEMO';
const CLINIC_EMAIL = 'dr.skander@example.tn';

async function cleanup() {
  const deleted = await prisma.queueEntry.deleteMany({
    where: { patientPhone: { startsWith: DEMO_PHONE_PREFIX } },
  });
  console.log(`Cleanup: removed ${deleted.count} demo queue entries.`);
}

async function seed() {
  // Find the dev clinic
  const clinic = await prisma.clinic.findUnique({ where: { email: CLINIC_EMAIL } });
  if (!clinic) {
    console.error(`Clinic not found: ${CLINIC_EMAIL}`);
    console.error('Run "pnpm db:seed" first to create the dev clinic.');
    process.exit(1);
  }

  // Remove any previous demo data
  await cleanup();

  const now = new Date();
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60_000);

  // ─── 8 COMPLETED patients (for "8 patients vus, temps moyen 14 min") ───
  //
  // The stats service computes avgWait = avg(calledAt - arrivedAt) for
  // COMPLETED entries today, EXCLUDING the last one by calledAt.
  // So the first 7 must average 14 min total: 7 × 14 = 98 min.
  //
  // Wait times for patients 1–7: 10, 12, 13, 14, 15, 16, 18 = 98 → avg 14
  // Patient 8 (excluded from avg): 12 min wait.
  const completedWaits = [10, 12, 13, 14, 15, 16, 18, 12]; // last is excluded
  const completedNames = [
    'Mme Amira Jebali',
    'M. Nabil Khelifi',
    'Mme Rim Bouazizi',
    'M. Hedi Laabidi',
    'Mme Ines Gharbi',
    'M. Raouf Haddad',
    'Mme Nour Saidi',
    'M. Fares Mbarki',
  ];

  const completedEntries = completedWaits.map((waitMin, i) => {
    // Stagger arrivals: earliest was ~4h ago, most recent ~35 min ago
    const arrivedMinAgo = 240 - i * 28;
    const arrived = minsAgo(arrivedMinAgo);
    const called = new Date(arrived.getTime() + waitMin * 60_000);
    const completed = new Date(called.getTime() + (10 + i) * 60_000); // 10–17 min consultations

    return {
      clinicId: clinic.id,
      patientName: completedNames[i],
      patientPhone: `${DEMO_PHONE_PREFIX}${String(i).padStart(2, '0')}`,
      position: 0,
      status: QueueStatus.COMPLETED,
      checkInMethod: i % 2 === 0 ? CheckInMethod.QR_CODE : CheckInMethod.MANUAL,
      arrivedAt: arrived,
      calledAt: called,
      completedAt: completed,
    };
  });

  // ─── 5 active patients (matching the screenshot reference) ───
  const activeEntries = [
    {
      clinicId: clinic.id,
      patientName: 'M. Karim Mansour',
      patientPhone: `${DEMO_PHONE_PREFIX}10`,
      position: 1,
      status: QueueStatus.IN_CONSULTATION,
      checkInMethod: CheckInMethod.MANUAL,
      arrivedAt: minsAgo(18),
      calledAt: minsAgo(2), // called 2 min ago, in consultation now
    },
    {
      clinicId: clinic.id,
      patientName: 'Mme Sana Trabelsi',
      patientPhone: `${DEMO_PHONE_PREFIX}11`,
      position: 2,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.QR_CODE,
      arrivedAt: minsAgo(22),
    },
    {
      clinicId: clinic.id,
      patientName: 'M. Youssef Ben Ali',
      patientPhone: `${DEMO_PHONE_PREFIX}12`,
      position: 3,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.MANUAL,
      arrivedAt: minsAgo(15),
    },
    {
      clinicId: clinic.id,
      patientName: 'Mme Leila Boughzala',
      patientPhone: `${DEMO_PHONE_PREFIX}13`,
      position: 4,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.QR_CODE,
      arrivedAt: minsAgo(8),
    },
    {
      clinicId: clinic.id,
      patientName: 'M. Tarek Cherni',
      patientPhone: `${DEMO_PHONE_PREFIX}14`,
      position: 5,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.MANUAL,
      arrivedAt: minsAgo(3),
    },
  ];

  // ─── Insert all entries ───
  const all = [...completedEntries, ...activeEntries];
  for (const entry of all) {
    await prisma.queueEntry.create({ data: entry });
  }

  console.log(`Inserted ${completedEntries.length} COMPLETED + ${activeEntries.length} active entries.`);
  console.log('');
  console.log('Active queue:');
  console.log('  #1  M. Karim Mansour    IN_CONSULTATION  18 min');
  console.log('  #2  Mme Sana Trabelsi   WAITING          22 min');
  console.log('  #3  M. Youssef Ben Ali  WAITING          15 min');
  console.log('  #4  Mme Leila Boughzala WAITING           8 min');
  console.log('  #5  M. Tarek Cherni     WAITING           3 min');
  console.log('');
  console.log('Stats: 8 patients vus, temps moyen ~14 min');
  console.log('');
  console.log('To clean up:  npx tsx prisma/seed-screenshot.ts --cleanup');
}

async function main() {
  if (process.argv.includes('--cleanup')) {
    await cleanup();
  } else {
    await seed();
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
