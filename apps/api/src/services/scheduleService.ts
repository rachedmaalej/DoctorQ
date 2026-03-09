import { prisma } from '../lib/prisma.js';

/**
 * Get today's schedule slots for a clinic, including linked queue entries.
 */
export async function getTodaySlots(clinicId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.scheduleSlot.findMany({
    where: {
      clinicId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
    include: {
      queueEntry: {
        select: {
          id: true,
          patientName: true,
          status: true,
          arrivedAt: true,
          calledAt: true,
          completedAt: true,
        },
      },
      doctor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startTime: 'asc' },
  });
}

/**
 * Create a single schedule slot.
 */
export async function createSlot(data: {
  clinicId: string;
  doctorId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  slotType: 'named' | 'regulation' | 'unplanned';
  patientName?: string;
}) {
  return prisma.scheduleSlot.create({
    data: {
      clinicId: data.clinicId,
      doctorId: data.doctorId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      slotType: data.slotType,
      patientName: data.patientName,
    },
  });
}

/**
 * Link a queue entry to a schedule slot.
 */
export async function linkPatientToSlot(slotId: string, queueEntryId: string) {
  return prisma.queueEntry.update({
    where: { id: queueEntryId },
    data: { slotId },
  });
}

/**
 * Generate regulation (buffer) slots for a doctor based on config.
 * Creates slots for today that don't already exist.
 */
export async function createRegulationSlots(
  clinicId: string,
  doctorId: string,
  config: { slotsPerHour: number; slotDurationMins: number },
  workingHours: { start: number; end: number } = { start: 8, end: 18 }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if regulation slots already exist for today
  const existing = await prisma.scheduleSlot.count({
    where: {
      clinicId,
      doctorId,
      date: today,
      slotType: 'regulation',
    },
  });

  if (existing > 0) return []; // Already generated

  const slots: Array<{
    clinicId: string;
    doctorId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    slotType: 'regulation';
  }> = [];

  for (let hour = workingHours.start; hour < workingHours.end; hour++) {
    for (let i = 0; i < config.slotsPerHour; i++) {
      const minuteOffset = Math.floor((60 / config.slotsPerHour) * i);
      const startTime = new Date(today);
      startTime.setHours(hour, minuteOffset, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + config.slotDurationMins);

      slots.push({
        clinicId,
        doctorId,
        date: today,
        startTime,
        endTime,
        slotType: 'regulation',
      });
    }
  }

  if (slots.length === 0) return [];

  await prisma.scheduleSlot.createMany({ data: slots });

  return prisma.scheduleSlot.findMany({
    where: {
      clinicId,
      doctorId,
      date: today,
      slotType: 'regulation',
    },
    orderBy: { startTime: 'asc' },
  });
}

/**
 * Create multiple schedule slots in a single transaction.
 * Returns the full list of today's slots (with includes) after creation.
 */
export async function createSlotsBatch(
  clinicId: string,
  slots: Array<{
    doctorId: string;
    startTime: Date;
    endTime: Date;
    slotType: 'named' | 'regulation' | 'unplanned';
    patientName?: string;
  }>
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data = slots.map((s) => ({
    clinicId,
    doctorId: s.doctorId,
    date: today,
    startTime: s.startTime,
    endTime: s.endTime,
    slotType: s.slotType,
    patientName: s.patientName,
  }));

  await prisma.scheduleSlot.createMany({ data });
  return getTodaySlots(clinicId);
}

/**
 * Delete all schedule slots for a clinic on a given date.
 * Used by midnight cron to clear the day's schedule.
 */
export async function clearDaySlots(clinicId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return prisma.scheduleSlot.deleteMany({
    where: {
      clinicId,
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
  });
}
