import cron from 'node-cron';
import { prisma } from './prisma.js';
import { clearQueue } from '../services/queueService.js';
import { emitToRoom } from './socket.js';

export function initScheduledTasks() {
  // Reset all queues and set doctors absent at midnight Tunisia time
  cron.schedule('0 0 * * *', async () => {
    console.log('[Midnight Reset] Starting daily queue reset...');

    try {
      const clinics = await prisma.clinic.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
      });

      for (const clinic of clinics) {
        const cleared = await clearQueue(clinic.id);

        await prisma.clinic.update({
          where: { id: clinic.id },
          data: { isDoctorPresent: false },
        });

        emitToRoom(`clinic:${clinic.id}`, 'doctor:presence', {
          clinicId: clinic.id,
          isDoctorPresent: false,
        });

        emitToRoom(`clinic:${clinic.id}:patients`, 'doctor:presence', {
          clinicId: clinic.id,
          isDoctorPresent: false,
        });

        console.log(`[Midnight Reset] ${clinic.name}: cleared ${cleared} entries, doctor set absent`);
      }

      console.log(`[Midnight Reset] Complete. Reset ${clinics.length} clinic(s).`);
    } catch (error) {
      console.error('[Midnight Reset] Error:', error);
    }
  }, {
    timezone: 'Africa/Tunis',
  });

  console.log('⏰ Midnight queue reset scheduled (Africa/Tunis timezone)');
}
