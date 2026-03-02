/**
 * Backfill Patient records from existing QueueEntry data.
 *
 * For each QueueEntry with a non-empty phone, upserts a Patient keyed on
 * (clinicId, phone) and links the entry to the patient.
 *
 * Usage:
 *   cd apps/api && npx tsx ../../scripts/backfill-patients.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Patient backfill...');

  // Fetch all queue entries with a phone, ordered by arrival time (oldest first)
  const entries = await prisma.queueEntry.findMany({
    where: {
      phone: { not: '' },
      patientId: null, // Only entries not yet linked
    },
    orderBy: { arrivedAt: 'asc' },
    select: {
      id: true,
      clinicId: true,
      patientName: true,
      phone: true,
    },
  });

  console.log(`Found ${entries.length} unlinked entries with phone numbers.`);

  let created = 0;
  let updated = 0;
  let linked = 0;
  let errors = 0;

  for (const entry of entries) {
    if (!entry.phone) continue;

    try {
      const existing = await prisma.patient.findUnique({
        where: { clinicId_phone: { clinicId: entry.clinicId, phone: entry.phone } },
      });

      const patient = await prisma.patient.upsert({
        where: { clinicId_phone: { clinicId: entry.clinicId, phone: entry.phone } },
        create: {
          clinicId: entry.clinicId,
          name: entry.patientName || '',
          phone: entry.phone,
          visitCount: 1,
        },
        update: {
          visitCount: { increment: 1 },
          ...(entry.patientName && { name: entry.patientName }),
        },
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }

      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { patientId: patient.id },
      });
      linked++;
    } catch (err) {
      errors++;
      console.error(`Error processing entry ${entry.id}:`, err);
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Patients created: ${created}`);
  console.log(`  Patients updated: ${updated}`);
  console.log(`  Entries linked:   ${linked}`);
  console.log(`  Errors:           ${errors}`);
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
