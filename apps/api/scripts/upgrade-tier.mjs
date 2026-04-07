import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const email = process.argv[2] || 'test@ausuivant.fr';
const newTier = process.argv[3] || 'SOLO_PRO';

const clinic = await prisma.clinic.findUnique({
  where: { email },
  select: { id: true, email: true, name: true, subscriptionTier: true, subscriptionStatus: true }
});

if (!clinic) {
  console.log(`No clinic found with email: ${email}`);
  process.exit(1);
}

console.log('BEFORE:', clinic);

const updated = await prisma.clinic.update({
  where: { email },
  data: { subscriptionTier: newTier },
  select: { id: true, email: true, name: true, subscriptionTier: true, subscriptionStatus: true }
});

console.log('AFTER:', updated);
await prisma.$disconnect();
