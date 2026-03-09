/**
 * Seed script: populates Dr. Perrin's clinic (AuSuivant/France) with sample patients.
 *
 * Usage:
 *   cd apps/api && npx tsx prisma/seed-perrin.ts          # seed
 *   cd apps/api && npx tsx prisma/seed-perrin.ts --clean   # remove seeded data
 */
import { PrismaClient, QueueStatus, CheckInMethod, DoctorState, SlotType } from '@prisma/client';

const prisma = new PrismaClient();

const PERRIN_EMAIL = 'dr.perrin@example.fr';

// Tag so we can identify and delete seed entries later
const SEED_TAG = '+33600000'; // phone prefix used only by seed patients
const SEED_SLOT_PREFIX = 'seed-slot-'; // ID prefix for seed schedule slots

const samplePatients = [
  { name: 'Marie Dupont',      phone: '+33600000101', method: CheckInMethod.MANUAL },
  { name: 'Jean-Luc Martin',   phone: '+33600000102', method: CheckInMethod.QR_CODE },
  { name: 'Sophie Laurent',    phone: '+33600000103', method: CheckInMethod.MANUAL },
  { name: 'Pierre Moreau',     phone: '+33600000104', method: CheckInMethod.QR_CODE },
  { name: 'Camille Bernard',   phone: '+33600000105', method: CheckInMethod.MANUAL },
  { name: 'Julien Petit',      phone: '+33600000106', method: CheckInMethod.QR_CODE },
  { name: 'Nathalie Robert',   phone: '+33600000107', method: CheckInMethod.MANUAL },
  { name: 'Antoine Richard',   phone: '+33600000108', method: CheckInMethod.QR_CODE },
  { name: 'Isabelle Thomas',   phone: '+33600000109', method: CheckInMethod.MANUAL },
  { name: 'François Durand',   phone: '+33600000110', method: CheckInMethod.QR_CODE },
  { name: 'Émilie Leroy',      phone: '+33600000111', method: CheckInMethod.MANUAL },
  { name: 'Lucas Simon',       phone: '+33600000112', method: CheckInMethod.QR_CODE },
];

async function seed() {
  const clinic = await prisma.clinic.findUnique({ where: { email: PERRIN_EMAIL } });
  if (!clinic) {
    console.error(`Clinic not found for ${PERRIN_EMAIL}. Run the main seed first: pnpm db:seed`);
    process.exit(1);
  }

  // Create 2 doctors
  const [drPerrin, drLefevre] = await Promise.all([
    prisma.doctor.upsert({
      where: { id: 'seed-doc-perrin' },
      update: {},
      create: {
        id: 'seed-doc-perrin',
        clinicId: clinic.id,
        name: 'Dr. Perrin',
        specialty: 'Généraliste',
        isActive: true,
        avgConsultationMins: 15,
        state: DoctorState.consulting,
        stateUpdatedAt: new Date(),
        colorToken: 'blue',
      },
    }),
    prisma.doctor.upsert({
      where: { id: 'seed-doc-lefevre' },
      update: {},
      create: {
        id: 'seed-doc-lefevre',
        clinicId: clinic.id,
        name: 'Dr. Lefèvre',
        specialty: 'Pédiatre',
        isActive: true,
        avgConsultationMins: 20,
        state: DoctorState.consulting,
        stateUpdatedAt: new Date(),
        colorToken: 'emerald',
      },
    }),
  ]);

  // Enable multi-doctor on the clinic
  await prisma.clinic.update({
    where: { id: clinic.id },
    data: { multiDoctorEnabled: true, isDoctorPresent: true },
  });

  const now = new Date();

  // Build queue entries with mixed statuses
  const entries = samplePatients.map((p, i) => {
    const minutesAgo = (samplePatients.length - i) * 12; // staggered arrivals
    const arrivedAt = new Date(now.getTime() - minutesAgo * 60 * 1000);
    const doctor = i % 3 === 2 ? drLefevre : drPerrin; // ~1/3 go to Lefèvre

    let status = QueueStatus.WAITING;
    let calledAt: Date | undefined;
    let notifiedAt: Date | undefined;
    let completedAt: Date | undefined;
    let appointmentTime: Date | undefined;

    if (i === 0) {
      // First patient: in consultation
      status = QueueStatus.IN_CONSULTATION;
      calledAt = new Date(now.getTime() - 8 * 60 * 1000);
    } else if (i === 1) {
      // Second: also in consultation (different doctor)
      status = QueueStatus.IN_CONSULTATION;
      calledAt = new Date(now.getTime() - 5 * 60 * 1000);
    } else if (i === 2) {
      // Third: notified (next up)
      status = QueueStatus.NOTIFIED;
      notifiedAt = new Date(now.getTime() - 1 * 60 * 1000);
    } else if (i === 10) {
      // One completed
      status = QueueStatus.COMPLETED;
      calledAt = new Date(now.getTime() - 40 * 60 * 1000);
      completedAt = new Date(now.getTime() - 25 * 60 * 1000);
    } else if (i === 11) {
      // One no-show
      status = QueueStatus.NO_SHOW;
      calledAt = new Date(now.getTime() - 30 * 60 * 1000);
    }

    // Give some patients appointment times
    if (i >= 3 && i <= 6) {
      const slotHour = 9 + Math.floor(i / 2);
      appointmentTime = new Date(now);
      appointmentTime.setHours(slotHour, (i % 2) * 30, 0, 0);
    }

    return {
      clinicId: clinic.id,
      doctorId: i === 1 ? drLefevre.id : (i % 3 === 2 ? drLefevre.id : drPerrin.id),
      patientName: p.name,
      patientPhone: p.phone,
      position: i + 1,
      status,
      checkInMethod: p.method,
      arrivedAt,
      calledAt,
      notifiedAt,
      completedAt,
      appointmentTime,
    };
  });

  // Clean existing seed entries first
  await prisma.queueEntry.deleteMany({
    where: { clinicId: clinic.id, patientPhone: { startsWith: SEED_TAG } },
  });

  for (const entry of entries) {
    await prisma.queueEntry.create({ data: entry });
  }

  // Create schedule slots for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slotDefs = [
    { id: `${SEED_SLOT_PREFIX}1`, doctorId: drPerrin.id, hour: 8, min: 30, dur: 30, name: 'Dupont Marie',     type: SlotType.named },
    { id: `${SEED_SLOT_PREFIX}2`, doctorId: drPerrin.id, hour: 9, min: 0,  dur: 30, name: 'Martin Jean-Luc',  type: SlotType.named },
    { id: `${SEED_SLOT_PREFIX}3`, doctorId: drPerrin.id, hour: 9, min: 30, dur: 30, name: 'Laurent Sophie',   type: SlotType.named },
    { id: `${SEED_SLOT_PREFIX}4`, doctorId: drPerrin.id, hour: 10, min: 0, dur: 15, name: null,               type: SlotType.regulation },
    { id: `${SEED_SLOT_PREFIX}5`, doctorId: drPerrin.id, hour: 10, min: 15, dur: 30, name: 'Moreau Pierre',   type: SlotType.named },
    { id: `${SEED_SLOT_PREFIX}6`, doctorId: drLefevre.id, hour: 9, min: 0,  dur: 30, name: 'Bernard Camille', type: SlotType.named },
    { id: `${SEED_SLOT_PREFIX}7`, doctorId: drLefevre.id, hour: 9, min: 30, dur: 30, name: 'Petit Julien',    type: SlotType.named },
    { id: `${SEED_SLOT_PREFIX}8`, doctorId: drLefevre.id, hour: 10, min: 0, dur: 15, name: null,              type: SlotType.regulation },
    { id: `${SEED_SLOT_PREFIX}9`, doctorId: drLefevre.id, hour: 10, min: 30, dur: 30, name: 'Robert Nathalie', type: SlotType.named },
  ];

  // Delete existing seed slots first
  await prisma.scheduleSlot.deleteMany({
    where: { id: { startsWith: SEED_SLOT_PREFIX } },
  });

  for (const s of slotDefs) {
    const start = new Date(today);
    start.setHours(s.hour, s.min, 0, 0);
    const end = new Date(start.getTime() + s.dur * 60 * 1000);

    await prisma.scheduleSlot.create({
      data: {
        id: s.id,
        clinicId: clinic.id,
        doctorId: s.doctorId,
        date: today,
        startTime: start,
        endTime: end,
        slotType: s.type,
        patientName: s.name,
      },
    });
  }

  console.log(`✓ Seeded ${slotDefs.length} schedule slots for today`);
  console.log(`✓ Seeded ${entries.length} patients into Dr. Perrin's queue`);
  console.log(`  - 2 in consultation (Perrin + Lefèvre)`);
  console.log(`  - 1 notified`);
  console.log(`  - 7 waiting (4 with appointments)`);
  console.log(`  - 1 completed, 1 no-show`);
  console.log(`  - 2 doctors: Dr. Perrin (Généraliste), Dr. Lefèvre (Pédiatre)`);
  console.log(`\nTo remove: cd apps/api && npx tsx prisma/seed-perrin.ts --clean`);
}

async function clean() {
  const clinic = await prisma.clinic.findUnique({ where: { email: PERRIN_EMAIL } });
  if (!clinic) {
    console.log('Clinic not found, nothing to clean.');
    return;
  }

  const deleted = await prisma.queueEntry.deleteMany({
    where: { clinicId: clinic.id, patientPhone: { startsWith: SEED_TAG } },
  });
  console.log(`✓ Deleted ${deleted.count} seed queue entries`);

  // Remove seed schedule slots
  const slots = await prisma.scheduleSlot.deleteMany({
    where: { id: { startsWith: SEED_SLOT_PREFIX } },
  });
  console.log(`✓ Deleted ${slots.count} seed schedule slots`);

  // Remove seed doctors
  const docs = await prisma.doctor.deleteMany({
    where: { id: { in: ['seed-doc-perrin', 'seed-doc-lefevre'] } },
  });
  console.log(`✓ Deleted ${docs.count} seed doctors`);
}

const isClean = process.argv.includes('--clean');

(isClean ? clean() : seed())
  .catch((e) => {
    console.error(isClean ? 'Clean failed:' : 'Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
