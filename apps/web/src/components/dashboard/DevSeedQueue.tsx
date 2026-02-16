/**
 * DEV ONLY — "Fill Queue" button that seeds 8 test patients.
 * Uses the brand config to pick TN or FR patient list.
 * TODO: Remove before production launch.
 */
import { useState } from 'react';
import { useQueueStore } from '@/stores/queueStore';
import { webBrand } from '@/lib/brand';
import type { AddPatientData } from '@/types';

const TN_PATIENTS: AddPatientData[] = [
  { patientName: 'Mohamed Ben Ali',   patientPhone: '20123456',  appointmentTime: '09:00' },
  { patientName: 'Fatma Trabelsi',    patientPhone: '55234567'  },
  { patientName: 'Ahmed Bouazizi',    patientPhone: '98345678',  appointmentTime: '09:30' },
  { patientName: 'Leila Mansouri',    patientPhone: '22456789'  },
  { patientName: 'Youssef Hammami',   patientPhone: '71567890',  appointmentTime: '10:00' },
  { patientName: 'Amira Chaabane',    patientPhone: '50678901'  },
  { patientName: 'Karim Jebali',      patientPhone: '93789012',  appointmentTime: '10:30' },
  { patientName: 'Sarra Mejri',       patientPhone: '99999999'  },
];

const FR_PATIENTS: AddPatientData[] = [
  { patientName: 'Jean Dupont',       patientPhone: '612345678',  appointmentTime: '09:00' },
  { patientName: 'Marie Laurent',     patientPhone: '723456789'  },
  { patientName: 'Pierre Martin',     patientPhone: '634567890',  appointmentTime: '09:30' },
  { patientName: 'Sophie Dubois',     patientPhone: '745678901'  },
  { patientName: 'Thomas Moreau',     patientPhone: '656789012',  appointmentTime: '10:00' },
  { patientName: 'Camille Bernard',   patientPhone: '767890123'  },
  { patientName: 'Nicolas Petit',     patientPhone: '678901234',  appointmentTime: '10:30' },
  { patientName: 'Émilie Roux',       patientPhone: '999999999'  },
];

export default function DevSeedQueue() {
  const addPatient = useQueueStore(s => s.addPatient);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const patients = webBrand.country === 'FR' ? FR_PATIENTS : TN_PATIENTS;

  const handleSeed = async () => {
    setLoading(true);
    try {
      for (const patient of patients) {
        try {
          await addPatient(patient);
        } catch {
          // skip duplicates (ALREADY_CHECKED_IN)
        }
      }
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-lg hover:bg-yellow-200 disabled:opacity-50 transition-colors"
      title="DEV: Fill queue with 8 test patients"
    >
      <span className="material-symbols-outlined text-base">science</span>
      {loading ? 'Seeding...' : done ? 'Done!' : 'DEV: Fill Queue (8)'}
    </button>
  );
}
