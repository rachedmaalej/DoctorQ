import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating admin account...');

  const email = 'rached@doctorq.tn';
  const password = 'BlesafAdmin2024!';

  // Check if account already exists
  const existing = await prisma.clinic.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`Account ${email} already exists (ID: ${existing.id})`);
    console.log('Updating password...');
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.clinic.update({
      where: { email },
      data: { passwordHash },
    });
    console.log('Password updated successfully!');
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const clinic = await prisma.clinic.create({
      data: {
        name: 'BléSaf Admin',
        doctorName: 'Admin',
        email,
        passwordHash,
        phone: '',
        address: '',
        language: 'fr',
        avgConsultationMins: 10,
        notifyAtPosition: 2,
        enableWhatsApp: false,
        isActive: true,
      },
    });
    console.log(`Created admin account: ${clinic.name} (ID: ${clinic.id})`);
  }

  console.log('\nAdmin Credentials:');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('Failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
