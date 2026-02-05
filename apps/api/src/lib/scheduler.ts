import cron from 'node-cron';
import { prisma } from './prisma.js';
import { archiveAndClearQueue } from '../services/queueService.js';
import { emitToRoom } from './socket.js';
import { sendTrialExpiringEmail } from './email.js';

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
        const { archived, deleted } = await archiveAndClearQueue(clinic.id);

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

        console.log(`[Midnight Reset] ${clinic.name}: archived ${archived} patients, deleted ${deleted} stale entries, doctor set absent`);
      }

      console.log(`[Midnight Reset] Complete. Reset ${clinics.length} clinic(s).`);
    } catch (error) {
      console.error('[Midnight Reset] Error:', error);
    }
  }, {
    timezone: 'Africa/Tunis',
  });

  // Check trial expirations at 9 AM Tunisia time
  cron.schedule('0 9 * * *', async () => {
    console.log('[Trial Check] Checking trial expirations...');

    try {
      const now = new Date();

      const clinics = await prisma.clinic.findMany({
        where: {
          subscriptionStatus: 'TRIAL',
          trialEndsAt: { not: null },
          emailVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          language: true,
          trialEndsAt: true,
        },
      });

      let emailsSent = 0;
      for (const clinic of clinics) {
        if (!clinic.trialEndsAt) continue;

        const daysRemaining = Math.ceil(
          (clinic.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysRemaining === 7 || daysRemaining === 3) {
          const lang = (clinic.language === 'ar' ? 'ar' : 'fr') as 'fr' | 'ar';
          await sendTrialExpiringEmail(clinic.email, clinic.name, daysRemaining, lang);
          emailsSent++;
          console.log(`[Trial Check] Sent ${daysRemaining}-day warning to ${clinic.name}`);
        }
      }

      console.log(`[Trial Check] Complete. Sent ${emailsSent} warning email(s).`);
    } catch (error) {
      console.error('[Trial Check] Error:', error);
    }
  }, {
    timezone: 'Africa/Tunis',
  });

  console.log('⏰ Midnight queue reset scheduled (Africa/Tunis timezone)');
  console.log('⏰ Trial expiration check scheduled at 9 AM (Africa/Tunis timezone)');
}
