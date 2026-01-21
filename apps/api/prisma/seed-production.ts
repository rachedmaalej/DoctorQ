import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding production database with Dr. Kamoun clinic...');

  // Check if clinic already exists
  const existingClinic = await prisma.clinic.findUnique({
    where: { email: 'dr.kamoun@doctorq.tn' }
  });

  if (existingClinic) {
    console.log('Clinic already exists, skipping seed.');
    return;
  }

  // Create Dr. Kamoun's clinic with secure password
  const passwordHash = await bcrypt.hash('DoctorQ2024!', 10);

  const clinic = await prisma.clinic.create({
    data: {
      name: 'Cabinet Dr Skander Kamoun',
      doctorName: 'Dr. Skander Kamoun',
      email: 'dr.kamoun@doctorq.tn',
      passwordHash,
      phone: '+21671234567',
      address: 'Tunis, Tunisia',
      language: 'fr',
      avgConsultationMins: 10,
      notifyAtPosition: 2,
      enableWhatsApp: false,
    },
  });

  console.log(`Created clinic: ${clinic.name}`);
  console.log(`Clinic ID: ${clinic.id}`);
  console.log('\nProduction Credentials:');
  console.log('Email: dr.kamoun@doctorq.tn');
  console.log('Password: DoctorQ2024!');
  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
