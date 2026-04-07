/**
 * Doctor Service
 * CRUD operations + state management for doctors within a clinic
 */

import { DoctorState } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { emitDoctorState, emitPatientTransferred } from '../lib/socket.js';

export interface CreateDoctorInput {
  clinicId: string;
  name: string;
  specialty?: string;
  avgConsultationMins?: number;
}

export interface UpdateDoctorInput {
  name?: string;
  specialty?: string;
  isActive?: boolean;
  avgConsultationMins?: number;
}

export async function getDoctors(clinicId: string) {
  return prisma.doctor.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getActiveDoctors(clinicId: string) {
  return prisma.doctor.findMany({
    where: { clinicId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getDoctor(clinicId: string, doctorId: string) {
  return prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
  });
}

export async function createDoctor(input: CreateDoctorInput) {
  const doctor = await prisma.doctor.create({
    data: {
      clinicId: input.clinicId,
      name: input.name,
      specialty: input.specialty,
      avgConsultationMins: input.avgConsultationMins ?? 15,
      // Start doctors as 'free' so they're immediately available for patient assignment
      state: 'free',
      stateUpdatedAt: new Date(),
    },
  });
  // Keep clinic presence flag in sync
  await syncClinicPresence(input.clinicId);
  return doctor;
}

export async function updateDoctor(clinicId: string, doctorId: string, input: UpdateDoctorInput) {
  // Verify doctor belongs to clinic
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
  });

  if (!doctor) return null;

  // Sync state with isActive toggle:
  // - Deactivating → state becomes 'inactive'
  // - Activating → state becomes 'free' (available for patient assignment)
  const data: Record<string, unknown> = { ...input };
  if (input.isActive !== undefined && input.isActive !== doctor.isActive) {
    data.state = input.isActive ? 'free' : 'inactive';
    data.stateUpdatedAt = new Date();
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data,
  });

  // Keep clinic presence flag in sync if state changed
  if (data.state) {
    await syncClinicPresence(clinicId);
  }

  return updated;
}

export async function deleteDoctor(clinicId: string, doctorId: string) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
  });

  if (!doctor) return false;

  // Prevent deleting the last active doctor
  const activeCount = await prisma.doctor.count({
    where: { clinicId, isActive: true },
  });

  if (activeCount <= 1) {
    throw Object.assign(new Error('Cannot remove the last active doctor'), {
      code: 'LAST_DOCTOR',
    });
  }

  // Reassign queue entries to the primary (oldest) remaining doctor
  const primaryDoctor = await prisma.doctor.findFirst({
    where: { clinicId, isActive: true, id: { not: doctorId } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (primaryDoctor) {
    await prisma.queueEntry.updateMany({
      where: { doctorId, status: { in: ['WAITING', 'NOTIFIED', 'IN_CONSULTATION'] } },
      data: { doctorId: primaryDoctor.id },
    });
  }

  await prisma.doctor.delete({ where: { id: doctorId } });
  return true;
}

// ─── Phase 3: Doctor State Management ───

const VALID_STATES: DoctorState[] = ['consulting', 'free', 'pause', 'absent_today', 'home_visit', 'inactive'];

export async function updateDoctorState(
  clinicId: string,
  doctorId: string,
  state: DoctorState,
  homeVisitETA?: string,
) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
  });
  if (!doctor) return null;

  if (!VALID_STATES.includes(state)) {
    throw new Error(`Invalid doctor state: ${state}`);
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      state,
      stateUpdatedAt: new Date(),
      homeVisitETA: state === 'home_visit' && homeVisitETA ? new Date(homeVisitETA) : null,
    },
  });

  emitDoctorState(clinicId, doctorId, state, homeVisitETA);

  // Keep clinic.isDoctorPresent in sync with doctor states
  await syncClinicPresence(clinicId);

  return updated;
}

/**
 * Sync clinic.isDoctorPresent from active doctor states.
 * Called after any doctor state change.
 */
export async function syncClinicPresence(clinicId: string): Promise<void> {
  const activePresent = await prisma.doctor.count({
    where: {
      clinicId,
      isActive: true,
      state: { in: ['consulting', 'free'] },
    },
  });

  await prisma.clinic.update({
    where: { id: clinicId },
    data: { isDoctorPresent: activePresent > 0 },
  });
}

export type AbsenceOption = 'close' | 'reassign' | 'keep';

export async function handleAbsence(
  clinicId: string,
  doctorId: string,
  option: AbsenceOption,
) {
  // Mark doctor as absent
  await updateDoctorState(clinicId, doctorId, 'absent_today');

  if (option === 'close') {
    // Cancel remaining schedule slots for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.scheduleSlot.deleteMany({
      where: {
        clinicId,
        doctorId,
        date: { gte: today, lt: tomorrow },
        queueEntry: null, // Only delete unfilled slots
      },
    });

    return { action: 'closed', reassigned: 0 };
  }

  if (option === 'reassign') {
    return reassignPatients(clinicId, doctorId);
  }

  // option === 'keep' — no further action
  return { action: 'kept', reassigned: 0 };
}

export async function reassignPatients(clinicId: string, fromDoctorId: string) {
  // Get available doctors (not absent, not inactive, not the departing doctor)
  const available = await prisma.doctor.findMany({
    where: {
      clinicId,
      isActive: true,
      id: { not: fromDoctorId },
      state: { in: ['free', 'consulting', 'pause'] },
    },
  });

  if (available.length === 0) {
    return { action: 'reassign_failed', reassigned: 0, reason: 'no_available_doctors' };
  }

  // Get waiting patients for the absent doctor
  const patients = await prisma.queueEntry.findMany({
    where: {
      clinicId,
      doctorId: fromDoctorId,
      status: { in: ['WAITING', 'NOTIFIED'] },
    },
    orderBy: { position: 'asc' },
  });

  if (patients.length === 0) {
    return { action: 'reassigned', reassigned: 0 };
  }

  // Get current queue counts per available doctor for balanced distribution
  const counts = new Map<string, number>();
  for (const doc of available) {
    const count = await prisma.queueEntry.count({
      where: {
        clinicId,
        doctorId: doc.id,
        status: { in: ['WAITING', 'NOTIFIED'] },
      },
    });
    counts.set(doc.id, count);
  }

  // Distribute patients to doctor with fewest waiting
  let reassigned = 0;
  for (const patient of patients) {
    // Find doctor with lowest count
    let minDoc = available[0].id;
    let minCount = counts.get(available[0].id) || 0;
    for (const doc of available) {
      const c = counts.get(doc.id) || 0;
      if (c < minCount) {
        minDoc = doc.id;
        minCount = c;
      }
    }

    await prisma.queueEntry.update({
      where: { id: patient.id },
      data: { doctorId: minDoc },
    });

    emitPatientTransferred(clinicId, patient.id, fromDoctorId, minDoc);
    counts.set(minDoc, (counts.get(minDoc) || 0) + 1);
    reassigned++;
  }

  return { action: 'reassigned', reassigned };
}

export async function transferPatient(
  clinicId: string,
  patientId: string,
  targetDoctorId: string,
) {
  const entry = await prisma.queueEntry.findFirst({
    where: { id: patientId, clinicId },
  });
  if (!entry) return null;

  const targetDoctor = await prisma.doctor.findFirst({
    where: { id: targetDoctorId, clinicId, isActive: true },
  });
  if (!targetDoctor) return null;

  const fromDoctorId = entry.doctorId;

  const updated = await prisma.queueEntry.update({
    where: { id: patientId },
    data: { doctorId: targetDoctorId },
  });

  emitPatientTransferred(clinicId, patientId, fromDoctorId || '', targetDoctorId);
  return updated;
}
