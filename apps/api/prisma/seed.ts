import { PrismaClient, QueueStatus, CheckInMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test clinic (Dr. Ahmed, La Marsa)
  const passwordHash = await bcrypt.hash('password123', 10);

  const clinic = await prisma.clinic.upsert({
    where: { email: 'dr.ahmed@example.tn' },
    update: {},
    create: {
      name: 'Cabinet Dr. Ahmed',
      doctorName: 'Dr. Ahmed Ben Ali',
      email: 'dr.ahmed@example.tn',
      passwordHash,
      phone: '+21671234567',
      address: 'La Marsa, Tunis',
      language: 'fr',
      avgConsultationMins: 15,
      notifyAtPosition: 2,
      enableWhatsApp: false,
    },
  });

  console.log(`✅ Created test clinic: ${clinic.name}`);

  // Create test queue entries with various statuses
  const now = new Date();
  const queueEntries = [
    {
      clinicId: clinic.id,
      patientName: 'Mohamed Trabelsi',
      patientPhone: '+21698765432',
      position: 1,
      status: QueueStatus.IN_CONSULTATION,
      checkInMethod: CheckInMethod.QR_CODE,
      arrivedAt: new Date(now.getTime() - 90 * 60 * 1000), // 90 min ago
      calledAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 min ago
    },
    {
      clinicId: clinic.id,
      patientName: 'Fatma Khalil',
      patientPhone: '+21694123456',
      position: 2,
      status: QueueStatus.NOTIFIED,
      checkInMethod: CheckInMethod.MANUAL,
      arrivedAt: new Date(now.getTime() - 75 * 60 * 1000), // 75 min ago
      notifiedAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 min ago
    },
    {
      clinicId: clinic.id,
      patientName: 'Ali Sassi',
      patientPhone: '+21699887766',
      position: 3,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.QR_CODE,
      arrivedAt: new Date(now.getTime() - 60 * 60 * 1000), // 60 min ago
    },
    {
      clinicId: clinic.id,
      patientName: 'Sara Ben Amor',
      patientPhone: '+21691234567',
      position: 4,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.WHATSAPP,
      arrivedAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 min ago
    },
    {
      clinicId: clinic.id,
      patientName: 'Youssef Mansour',
      patientPhone: '+21697654321',
      position: 5,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.QR_CODE,
      arrivedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 min ago
    },
    {
      clinicId: clinic.id,
      patientName: 'Amira Jebali',
      patientPhone: '+21698123456',
      position: 6,
      status: QueueStatus.WAITING,
      checkInMethod: CheckInMethod.MANUAL,
      arrivedAt: new Date(now.getTime() - 15 * 60 * 1000), // 15 min ago
    },
  ];

  // Delete existing queue entries for this clinic to avoid duplicates
  await prisma.queueEntry.deleteMany({
    where: { clinicId: clinic.id },
  });

  // Create queue entries
  for (const entry of queueEntries) {
    await prisma.queueEntry.create({ data: entry });
  }

  console.log(`✅ Created ${queueEntries.length} test queue entries`);

  // Create some historical stats
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  await prisma.dailyStat.upsert({
    where: {
      clinicId_date: {
        clinicId: clinic.id,
        date: yesterday,
      },
    },
    update: {},
    create: {
      clinicId: clinic.id,
      date: yesterday,
      totalPatients: 28,
      avgWaitMins: 65,
      noShows: 2,
    },
  });

  console.log('✅ Created historical stats');

  console.log('\n🎉 Seeding complete!');
  console.log('\nTest Credentials:');
  console.log('Email: dr.ahmed@example.tn');
  console.log('Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
