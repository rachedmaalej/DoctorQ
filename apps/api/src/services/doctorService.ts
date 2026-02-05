/**
 * Doctor Service
 * CRUD operations for managing doctors within a clinic
 */

import { prisma } from '../lib/prisma.js';

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
  return prisma.doctor.create({
    data: {
      clinicId: input.clinicId,
      name: input.name,
      specialty: input.specialty,
      avgConsultationMins: input.avgConsultationMins ?? 15,
    },
  });
}

export async function updateDoctor(clinicId: string, doctorId: string, input: UpdateDoctorInput) {
  // Verify doctor belongs to clinic
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
  });

  if (!doctor) return null;

  return prisma.doctor.update({
    where: { id: doctorId },
    data: input,
  });
}

export async function deleteDoctor(clinicId: string, doctorId: string) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId },
  });

  if (!doctor) return false;

  // Unset doctorId on queue entries instead of deleting them
  await prisma.queueEntry.updateMany({
    where: { doctorId },
    data: { doctorId: null },
  });

  await prisma.doctor.delete({ where: { id: doctorId } });
  return true;
}
