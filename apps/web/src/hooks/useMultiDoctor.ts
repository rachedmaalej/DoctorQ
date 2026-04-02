import { useMemo } from 'react';
import type { Doctor } from '@/types';

interface UseMultiDoctorResult {
  /** All doctors including inactive */
  allDoctors: Doctor[];
  /** Only doctors with state !== 'inactive' and isActive === true */
  activeDoctors: Doctor[];
  /** true when 2+ doctors are active */
  isMultiDoctor: boolean;
  /** The primary (first) active doctor — always exists */
  primaryDoctor: Doctor;
  /** Shortcut: the primary active doctor's ID */
  currentDoctorId: string;
}

export function useMultiDoctor(doctors: Doctor[]): UseMultiDoctorResult {
  return useMemo(() => {
    const activeDoctors = doctors.filter(
      (d) => d.isActive && d.state !== 'inactive'
    );
    const primaryDoctor = activeDoctors[0] ?? doctors[0];

    return {
      allDoctors: doctors,
      activeDoctors,
      isMultiDoctor: activeDoctors.length > 1,
      primaryDoctor,
      currentDoctorId: primaryDoctor?.id ?? '',
    };
  }, [doctors]);
}
