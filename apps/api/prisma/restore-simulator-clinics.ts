/**
 * Restore the 3 simulator test clinics with their specific IDs.
 * These IDs match simulator/blesaf-simulator/config/clinics.json.
 *
 * Usage: cd apps/api && npx tsx prisma/restore-simulator-clinics.ts
 */

import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CLINICS = [
  {
    id: '5a0c2bb3-c3a7-402c-a05b-cff6f968d0aa',
    name: 'Dr. Yasmine — Ophthalmology',
    doctorName: 'Dr. Yasmine',
    doctorGender: 'F',
    email: 'yasmine@blesaf-test.tn',
    password: 'test-yasmine-2026',
    phone: '+21698100001',
    address: 'Avenue Habib Bourguiba, Tunis',
    specialty: 'ophthalmology',
    avgConsultationMins: 8,
  },
  {
    id: '12d5a724-e8ee-4d11-bb82-4aeca4357f3f',
    name: 'Dr. Maya — Dermatology',
    doctorName: 'Dr. Maya',
    doctorGender: 'F',
    email: 'maya@blesaf-test.tn',
    password: 'test-maya-2026',
    phone: '+21698100002',
    address: 'Rue de Marseille, Tunis',
    specialty: 'dermatology',
    avgConsultationMins: 12,
  },
  {
    id: '2bb8d51a-63a6-4eba-b40d-eed51642961f',
    name: 'Dr. Hedi — Gynecology',
    doctorName: 'Dr. Hedi',
    doctorGender: 'M',
    email: 'hedi@blesaf-test.tn',
    password: 'test-hedi-2026',
    phone: '+21698100003',
    address: 'Avenue Mohamed V, Sousse',
    specialty: 'gynecology',
    avgConsultationMins: 18,
  },
];

async function main() {
  console.log('Restoring 3 simulator test clinics...\n');

  for (const def of CLINICS) {
    // Skip if already exists
    const existing = await prisma.clinic.findFirst({
      where: { OR: [{ id: def.id }, { email: def.email }] },
    });
    if (existing) {
      console.log(`  ⏭️  ${def.name} already exists (${existing.email})`);
      continue;
    }

    const passwordHash = await bcrypt.hash(def.password, 10);
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    await prisma.clinic.create({
      data: {
        id: def.id,
        name: def.name,
        doctorName: def.doctorName,
        doctorGender: def.doctorGender,
        email: def.email,
        passwordHash,
        emailVerified: true,
        phone: def.phone,
        address: def.address,
        language: 'fr',
        country: 'TN',
        specialty: def.specialty,
        avgConsultationMins: def.avgConsultationMins,
        notifyAtPosition: 2,
        enableWhatsApp: false,
        businessType: 'medical',
        isActive: true,
        isDoctorPresent: false,
        onboardingCompleted: true,
        onboardingStep: 3,
        subscriptionStatus: SubscriptionStatus.TRIAL,
        trialEndsAt,
      },
    });

    console.log(`  ✅ ${def.name} (${def.email} / ${def.password})`);
  }

  console.log('\nDone! Simulator clinics restored.');
}

main()
  .catch((e) => {
    console.error('Failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
