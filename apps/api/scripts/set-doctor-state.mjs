import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const doctorId = process.argv[2];
const newState = process.argv[3] || 'free';

if (!doctorId) {
  console.log('Usage: node set-doctor-state.mjs <doctorId> [state]');
  process.exit(1);
}

const updated = await prisma.doctor.update({
  where: { id: doctorId },
  data: { state: newState, stateUpdatedAt: new Date() },
  select: { id: true, name: true, state: true, isActive: true },
});
console.log('Updated:', updated);
await prisma.$disconnect();
