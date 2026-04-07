import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const email = process.argv[2] || 'test@ausuivant.fr';

const clinic = await prisma.clinic.findUnique({
  where: { email },
  select: {
    id: true,
    doctors: {
      select: { id: true, name: true, specialty: true, isActive: true, state: true },
      orderBy: { createdAt: 'asc' },
    },
  },
});

if (!clinic) {
  console.log(`No clinic found with email: ${email}`);
  process.exit(1);
}

console.log('Doctors for', email, ':');
console.table(clinic.doctors);
await prisma.$disconnect();
